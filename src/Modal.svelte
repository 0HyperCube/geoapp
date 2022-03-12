<script lang="ts">
	import { push, ref } from "firebase/database";

	import { user_id, db, logged_in, province_owners } from "./database";
	import { scale, fade } from "svelte/transition";
	import { province_neighbours } from "./countries";

	export let modal_open = false;
	export let province = "";
	export let regions = new Map();
	export let coastal_regions = [];

	let modal_el: HTMLElement;
	let focus_element: HTMLElement;
	$: coastal = coastal_regions.includes(province);
	$: owner = $province_owners.get(province);

	function inside_modal(el: EventTarget): boolean {
		if (el instanceof Node) return modal_el.contains(el);
		return false;
	}

	function focus_modal() {
		focus_element.focus();
	}

	function close_modal() {
		modal_open = false;
	}
	function close_modal_if_outside(ev: PointerEvent) {
		if (!inside_modal(ev.target)) {
			modal_open = false;
		}
	}
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

	$: {
		if (modal_el) {
			focus_modal();
		}
	}

	document.addEventListener("focusin", (evt) => {
		if (modal_open && !inside_modal(evt.target)) {
			focus_modal();
		}
	});
	document.onkeydown = (e: KeyboardEvent) => {
		if (modal_open && e.key === "Escape") {
			modal_open = false;
		}
	};
</script>

{#if modal_open}
	<div class="background" transition:fade={{ delay: 0, duration: 400 }} />

	<div
		class="modal"
		on:pointerup={close_modal_if_outside}
		transition:scale={{ delay: 0, duration: 500 }}
	>
		<div class="content-wrapper" bind:this={modal_el}>
			<h1>{province.replaceAll("_", " ")} Province</h1>
			<p>Region: {regions.get(province).name}</p>
			<p>{coastal ? "Coastal" : "Landlocked"}</p>
			<p>Owner: {owner ? owner : "None"}</p>
			<div class="actions">
				{#if $logged_in && !owner && coastal}
					<button on:click={conquor}>Explore via sea</button>
				{/if}
				{#if $logged_in && owner === $user_id}
					<button on:click={explore}
						>Scout {count_exploration(province, $province_owners)} neighbours</button
					>
				{/if}
				<button on:click={close_modal} bind:this={focus_element}>Close</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.background {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: rgba(0, 0, 0, 0.4);
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;

		display: flex;
		justify-content: center;
		align-items: center;
		opacity: 1;
	}
	div.content-wrapper {
		z-index: 10;
		max-width: 70vw;
		border-radius: 0.3rem;
		background-color: var(--card-colour);
		overflow: hidden;
		padding: 20px;
	}
	@media (max-width: 767px) {
		div.content-wrapper {
			max-width: 100vw;
		}
	}
	h1 {
		margin: 0 0 20px 0;
	}
	p {
		margin: 0;
	}
	.actions {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		margin-top: 7px;
	}
	button {
		margin: 5px;
	}
</style>
