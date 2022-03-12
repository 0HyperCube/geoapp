<script lang="ts">
	import { push, ref } from "firebase/database";

	import { user_id, db, logged_in, province_owners } from "./database";
	import { province_neighbours } from "./countries";
	import Modal from "./Modal.svelte";

	export let province = "";
	export let regions = new Map();
	export let coastal_regions = [];

	export let modal_open = false;

	$: coastal = coastal_regions.includes(province);
	$: owner = $province_owners.get(province);
	$: scoutable = count_exploration(province, $province_owners);

	function conquor() {
		push(ref(db, `territories/${$user_id}/provinces`), province);
	}
	function explore() {
		let explore_from = [province];
		let discovered_count = 0;
		while (explore_from.length > 0 && discovered_count < 4) {
			province_neighbours.get(explore_from.pop()).forEach((new_province) => {
				if (discovered_count < 4 && !$province_owners.get(new_province)) {
					explore_from.push(new_province);
					push(ref(db, `territories/${$user_id}/provinces`), new_province);
					discovered_count += 1;
				}
			});
		}
	}
	function count_exploration(
		province: string,
		province_owners: Map<string, string>
	) {
		if (!province) return 0;

		let explore_from = [province];
		let discovered_count = 0;
		while (explore_from.length > 0 && discovered_count < 4) {
			province_neighbours.get(explore_from.pop()).forEach((new_province) => {
				if (discovered_count < 4 && !province_owners.get(new_province)) {
					explore_from.push(new_province);
					discovered_count += 1;
				}
			});
		}
		return discovered_count;
	}
</script>

<Modal bind:modal_open>
	<span slot="title">{province.replaceAll("_", " ")} Province</span>
	<div slot="conent">
		<p>Region: {regions.get(province).name}</p>
		<p>{coastal ? "Coastal" : "Landlocked"}</p>
		<p>Owner: {owner ? owner : "None"}</p>
	</div>
	<span slot="action">
		{#if $logged_in && !owner && coastal}
			<button on:click={conquor}>Explore via sea</button>
		{/if}
		{#if $logged_in && owner === $user_id && scoutable > 0}
			<button on:click={explore}
				>Scout {scoutable} neighbour{scoutable == 1 ? "" : "s"}</button
			>
		{/if}
	</span>
</Modal>

<style>
	p {
		margin: 0;
	}
	button {
		margin: 5px;
	}
</style>
