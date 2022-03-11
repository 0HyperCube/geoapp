<script lang="ts">
	import { fade } from "svelte/transition";
	import { spring } from "svelte/motion";

	export {};

	// If there is a tooltip being displayed
	export let tooltip_visible = false;
	// The value tooltip being displayed
	export let province: string;
	// The position of the tooltip (springy)
	let tooltip_coords = spring(
		{ x: 50, y: 50 },
		{
			stiffness: 0.1,
			damping: 0.5,
		}
	);

	export function update_tooltip_location(event: PointerEvent) {
		if (
			event.target instanceof SVGElement &&
			event.target.parentElement.id === "map"
		) {
			province = event.target.id;
			tooltip_visible = true;
		} else {
			province = undefined;
			tooltip_visible = false;
		}

		tooltip_coords.set({ x: event.pageX, y: event.pageY });
	}
</script>

{#if tooltip_visible}
	<div
		transition:fade
		class="tooltip"
		style="left:{$tooltip_coords.x}px; top:{$tooltip_coords.y}px;"
	>
		{province.replaceAll("_", " ")}
	</div>
{/if}

<style>
	.tooltip {
		position: absolute;
		background-color: var(--page-colour);
		border-radius: 3px;
		margin: 10px;
		padding: 3px;
		pointer-events: none;
	}
</style>
