<script lang="ts">
	import { increment, ref, update } from "firebase/database";

	import {
		balance,
		db,
		development_level,
		income_per_province,
		owned_provinces_count,
		economic_hub_neighbours_count,
		user_id,
		income,
	} from "./database";
	import Modal from "./Modal.svelte";

	let modal_open = false;

	$: upgrade_cost = $development_level * 50 + 50;

	function upgrade() {
		let updates = {};
		updates[`users/${$user_id}/gc`] = increment(-upgrade_cost);
		updates[`development_levels/${$user_id}`] = increment(1);
		balance.update((balance) => balance - upgrade_cost);
		update(ref(db), updates);
	}

	const MAX_LEVEL = 30;
	$: within_max = $development_level < MAX_LEVEL;
</script>

<table>
	<tr><td>Balance</td><td>{$balance}gc</td></tr>
	<tr><td class="spacer" /></tr>

	<tr><td>Development level</td><td>{$development_level}</td></tr>
	<tr><td>GC per province</td><td>{$income_per_province}gc</td></tr>
	<tr><td>Provinces</td><td>{$owned_provinces_count}</td></tr>
	<tr
		><td>Economic hub neighbours (x2 income)</td><td
			>{$economic_hub_neighbours_count}</td
		></tr
	>
	<tr><td class="spacer" /></tr>

	<tr><td><b>Income per day</b></td><td><b>{$income}gc</b></td></tr>
</table>

<h3>Upgrades:</h3>

<button
	on:click={() => {
		modal_open = true;
	}}>Upgrade development level</button
>

<Modal bind:modal_open>
	<span slot="title"
		>{#if within_max}
			Upgrade to development level {$development_level + 1}
		{:else}
			Max development level reached
		{/if}
	</span>
	<div slot="conent">
		{#if within_max}
			<p>Current development level: {$development_level}</p>
			<p>Upgrade cost: {upgrade_cost}gc</p>
		{:else}
			<p>You are at the max development level of {MAX_LEVEL}</p>
			<p>Upgrade your income further by invading new provinces.</p>
		{/if}
	</div>
	<span slot="action">
		{#if within_max}
			{#if upgrade_cost <= $balance}
				<button on:click={upgrade}>Upgrade</button>
			{:else}
				<span class="modal-button">Not enough money</span>
			{/if}
		{/if}
	</span>
</Modal>

<style>
	td {
		width: 180px;
	}

	.spacer {
		padding-bottom: 10px;
	}

	h3 {
		margin-bottom: 5px;
	}
	button {
		margin: 0;
	}
	.modal-button {
		margin: 5px;
	}
	p {
		margin: 0;
	}
</style>
