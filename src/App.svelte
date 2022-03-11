<script lang="ts">
	import MapView from "./Map.svelte";
	import Units from "./Units.svelte";
	import Nav from "./Nav.svelte";

	import { onMount } from "svelte";

	import { initalise_database, logged_in, balance } from "./database";

	onMount(async () => {
		initalise_database();
	});

	let map_expanded = false;
</script>

<div class="document">
	<Nav />
	<main class:map_expanded>
		{#if !map_expanded && $logged_in}
			<h2>Finance</h2>
			<div class="card">
				<table>
					<tr><td>Balance</td><td>{$balance}</td></tr>
				</table>
			</div>
			<h2>Units</h2>
			<div class="card">
				<Units />
			</div>
		{/if}
		<h2>Map</h2>
		<div class="card" class:map_expanded>
			<MapView bind:expanded={map_expanded} />
		</div>
	</main>
	<div class:map_expanded={!map_expanded} />
</div>

<style>
	:global(:root) {
		--page-colour: #1b1a19;
		--card-colour: #252423;
	}
	.document {
		background-color: var(--page-colour);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1em;
		align-items: stretch;
		min-height: 100%;

		margin: 0;
	}

	td {
		padding-right: 100px;
	}

	main {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1em;
		align-items: stretch;
	}

	h2 {
		text-align: left;
		margin-left: 1em;
		margin-bottom: -0.4em;
		margin-top: 0;
	}

	@media (max-width: 640px) {
		main {
			max-width: none;
		}
	}
	.card {
		background-color: var(--card-colour);
		border-radius: 3px;
		padding: 10px;
		margin: 0 1em;
	}
	.map_expanded {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}
</style>
