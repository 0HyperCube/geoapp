<script lang="ts">
	import { get, increment, ref, update } from "firebase/database";

	import { floor, max, min } from "mathjs";

	import {
		balance,
		coastal_provinces_count,
		db,
		player_units,
		provinces_count,
		unit_limits,
		unit_values,
		user_id,
	} from "./database";

	import Modal from "./Modal.svelte";

	let unit_types = [...unit_values.keys()];

	let modal_open = false;
	let unit_purchasing = "Infantry";

	$: unit_value = unit_values.get(unit_purchasing);
	$: cost = unit_value.cost;

	$: affordable = cost <= $balance;
	$: max_units_cost = floor($balance / cost);
	$: provinces_per_unit = 1 / unit_value.force_limit;

	$: total_provinces = unit_value.requires_coast
		? min(
				$coastal_provinces_count.get($user_id),
				$provinces_count.get($user_id)
		  )
		: $provinces_count.get($user_id);

	$: available_provinces = unit_value.requires_coast
		? min(
				$coastal_provinces_count.get($user_id) - $unit_limits.total_naval_army,
				$provinces_count.get($user_id) - $unit_limits.total_army
		  )
		: $provinces_count.get($user_id) - $unit_limits.total_army;

	$: max_units_provinces = available_provinces / provinces_per_unit;

	$: max_units = floor(min(max_units_cost, max_units_provinces));

	let amount = 0;
	$: total_cost = cost * amount;

	$: {
		amount = max(min(amount || 0, max_units), 0);
	}

	function purchase() {
		let updates = {};
		updates[`users/${$user_id}/gc`] = increment(-total_cost);
		updates[`units/${$user_id}/${unit_purchasing}`] = increment(amount);
		balance.update((balance) => balance - total_cost);
		update(ref(db), updates);
	}
</script>

<table>
	{#each unit_types as unit_type}
		<tr
			><td>{unit_type}</td>
			<td>{$player_units.get($user_id)?.get(unit_type) ?? 0} units</td>
			<td
				>{($player_units.get($user_id)?.get(unit_type) ?? 0) *
					unit_values.get(unit_type).hp} hp
			</td></tr
		>
	{/each}
</table>

<button
	on:click={() => {
		modal_open = true;
	}}>Purchase Units</button
>

<Modal bind:modal_open>
	<span slot="title">Buy Units </span>
	<div slot="conent" class="content">
		<div class="row">
			Unit type:
			<select bind:value={unit_purchasing}>
				{#each unit_types as unit_type}
					<option value={unit_type}>{unit_type}</option>
				{/each}
			</select>
		</div>
		<div class="row">Cost: {cost}gc</div>
		<div class="row">
			{unit_value.requires_coast ? "Coastal provinces" : "Provinces"} per unit: {provinces_per_unit}
		</div>
		<div class="row">
			Available provinces: {available_provinces} / {total_provinces}
		</div>
		<div class="row">Health: {unit_value.hp}</div>
		<div class="row">
			Attack:
			<table>
				{#each unit_types as attack_unit}
					{#if unit_value.damage.get(attack_unit)}
						<tr
							><td>vs {attack_unit}</td>{unit_value.damage.get(attack_unit)}</tr
						>
					{/if}
				{/each}
			</table>
		</div>
		<hr />
		{#if affordable}
			<div class="row">
				Amount:
				<input
					type="range"
					min="0"
					max={`${max_units}`}
					step="1"
					bind:value={amount}
				/>
				<span class="amount"> {amount}</span>
			</div>
			<div class="row">Total cost: {total_cost}gc</div>
		{:else}
			<div class="row">You cannot afford any of these units.</div>
		{/if}
	</div>
	<span slot="action">
		{#if amount === 0 && affordable}
			<span>No units selected</span>
		{:else if affordable}
			<button on:click={purchase}>Purchase</button>
		{:else}
			<span class="modal-button">Not enough money</span>
		{/if}
	</span>
</Modal>

<style>
	td {
		width: 180px;
	}
	button {
		margin: 0;
	}
	.content {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 5px;
	}
	input {
		margin: 0;
	}
	.amount {
		width: 1em;
		text-align: right;
	}
	table {
		flex-grow: 1;
	}
	hr {
		border: none;
		outline: none;
		height: 1px;
		width: 100%;
		background-color: #ffffff50;
	}
</style>
