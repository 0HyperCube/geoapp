<script lang="ts">
	import { increment, ref, update } from "firebase/database";

	import { floor } from "mathjs";

	import { balance, db, user_id } from "./database";

	import Modal from "./Modal.svelte";

	let unit_values = new Map([
		["Infantry", { cost: 10, attack_power: 1, force_limit: 2 }],
		["Vehicular", { cost: 25, attack_power: 2, force_limit: 1 }],
		["Tank", { cost: 50, attack_power: 5, force_limit: 0.2 }],
		["Naval", { cost: 200, attack_power: 10, force_limit: 0.5 }],
		["Airborne", { cost: 250, attack_power: 25, force_limit: 0.1 }],
		["Submarine", { cost: 500, attack_power: 25, force_limit: 0.05 }],
	]);

	let owned_units = new Map([
		["Infantry", 5],
		["Vehicular", 3],
		["Tank", 6],
		["Naval", 3],
		["Airborne", 1],
		["Submarine", 2],
	]);

	let unit_types = [...unit_values.keys()];

	let modal_open = false;
	let unit_purchasing = "Infantry";
	$: cost = unit_values.get(unit_purchasing).cost;
	$: affordable = cost <= $balance;
	$: max_units = `${floor($balance / cost)}`;

	let amount = 0;
	$: total_attack = unit_values.get(unit_purchasing).attack_power * amount;
	$: total_cost = cost * amount;

	function purchase() {
		let updates = {};
		updates[`users/${$user_id}/gc`] = increment(-total_cost);
		updates[`units/${$user_id}/${unit_purchasing}`] = increment(1);
		balance.update((balance) => balance - total_cost);
		update(ref(db), updates);
	}
</script>

<table>
	{#each unit_types as unit_type}
		<tr
			><td>{unit_type}</td>
			<td>{owned_units.get(unit_type)} units</td>
			<td
				>{owned_units.get(unit_type) * unit_values.get(unit_type).attack_power} attack
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
		<div class="row">
			Cost: {cost}gc
		</div>
		{#if affordable}
			<div class="row">
				Amount:
				<input
					type="range"
					min="0"
					max={max_units}
					step="1"
					bind:value={amount}
				/>
				<span class="amount"> {amount}</span>
			</div>
			<div class="row">
				Total cost: {total_cost}gc
			</div>
			<div class="row">
				Total attack: {total_attack}
			</div>
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
</style>
