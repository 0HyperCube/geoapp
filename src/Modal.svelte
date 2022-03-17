<script lang="ts">
	import { scale, fade } from "svelte/transition";

	export let modal_open = false;
	let modal_el: HTMLElement;

	function inside_modal(el: EventTarget): boolean {
		if (el instanceof Node) return modal_el.contains(el);
		return false;
	}

	function focus_modal() {
		let el = modal_el.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		)[0];
		if (el instanceof HTMLElement) {
			el.focus();
		}
	}

	function close_modal() {
		modal_open = false;
	}
	function close_modal_if_outside(ev: PointerEvent) {
		if (!inside_modal(ev.target)) {
			modal_open = false;
		}
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
			<h1><slot name="title" /></h1>
			<slot name="conent" />
			<div class="actions">
				<slot name="action" />
				<button on:click={close_modal}>Close</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.background {
		position: fixed;
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
		align-items: center;
		margin-top: 7px;
	}
	button {
		margin: 5px;
	}
</style>
