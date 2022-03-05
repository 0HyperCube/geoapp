<script lang="ts">
	import Countries from "./Countries.svelte";
	import { abs } from "mathjs";
	import { fade } from "svelte/transition";
	import { spring } from "svelte/motion";

	// Width of countries in svg
	const countries_width = 1200;
	// Height of countries in svg
	const countries_height = 460;

	// The svg element that contains the countries
	let svg_element: SVGSVGElement;
	// The width of the svg containing the countries
	let svg_width = 1;
	// The height of the svg containing the countries
	let svg_height = 1;

	// If there is a tooltip being displayed
	let tooltip_visible = false;
	// The value tooltip being displayed
	let tooltip: string;

	// How zoomed in the user is
	let scale = 1;
	// Movement of countries on X
	let translation_x = 0;
	// Movement of countries on y
	let translation_y = 0;

	// If the user has transformed the viewport
	let has_transformed = false;

	$: {
		// Scale and centre the countries if the user is not moving the viewport
		if (!has_transformed) {
			let x = svg_width / countries_width;
			let y = svg_height / countries_height;
			scale = Math.min(x, y);
			translation_x = (svg_width - countries_width * scale) / (2 * scale);
			translation_y = (svg_height - countries_height * scale) / (2 * scale);
		}
	}

	// Is the user panning?
	let panning = false;
	// The position of the tooltip (springy)
	let tooltip_coords = spring(
		{ x: 50, y: 50 },
		{
			stiffness: 0.1,
			damping: 0.5,
		}
	);

	// Handle capturing the pointer and panning when pointer down
	function pointerDown(event: PointerEvent) {
		if (event.button !== 2) {
			svg_element.setPointerCapture(event.pointerId);
			panning = true;
		}
	}

	// Handle ctrl scroll to zoom
	function scroll(event: WheelEvent) {
		if (event.ctrlKey) {
			// Prevent the browser from zooming in the page
			event.preventDefault();

			has_transformed = true;

			// An arbiery scroll speed (stolen from graphite)
			const scroll_speed = 1 / 600;

			let zoom = 1 + abs(event.deltaY) * scroll_speed;
			if (event.deltaY > 0) {
				zoom = 1 / zoom;
			}

			scale *= zoom;

			// Zoom around the mouse cursor

			let new_viewport_x = countries_width / zoom;
			let new_viewport_y = countries_height / zoom;

			let delta_size_x = countries_width - new_viewport_x;
			let delta_size_y = countries_height - new_viewport_y;

			let delta_x = delta_size_x * (event.offsetX / countries_width);
			let delta_y = delta_size_y * (event.offsetY / countries_height);

			translation_x -= (delta_x / scale) * zoom;
			translation_y -= (delta_y / scale) * zoom;
		}
	}

	function pointerMove(event: PointerEvent) {
		if (panning) {
			translation_x += event.movementX / scale;
			translation_y += event.movementY / scale;

			has_transformed = true;
		}

		if (
			event.target instanceof SVGElement &&
			event.target.parentElement.id === "country-group"
		) {
			tooltip = event.target.id.replaceAll("_", " ");
			tooltip_visible = true;
		} else {
			tooltip_visible = false;
		}

		tooltip_coords.set({ x: event.pageX, y: event.pageY });
	}
	function pointerUp() {
		panning = false;
	}
</script>

<div bind:clientWidth={svg_width} bind:clientHeight={svg_height}>
	<svg
		version="1.1"
		id="map"
		xmlns="http://www.w3.org/2000/svg"
		preserveAspectRatio="xMinYMin"
		class="map"
		on:pointerdown={pointerDown}
		on:pointermove={pointerMove}
		on:pointerup={pointerUp}
		on:wheel={scroll}
		on:mouseleave={() => {
			tooltip_visible = false;
		}}
		bind:this={svg_element}
	>
		<g
			transform="scale({scale}) translate({translation_x},{translation_y})"
			id="country-group"
		>
			<Countries />
		</g>
	</svg>
</div>

{#if tooltip_visible}
	<div
		transition:fade
		class="tooltip"
		style="left:{$tooltip_coords.x}px; top:{$tooltip_coords.y}px;"
	>
		{tooltip}
	</div>
{/if}

<style>
	.map {
		border: 1px solid grey;
		width: 100%;
		height: 50vh;
	}
	.tooltip {
		position: absolute;
		background-color: blanchedalmond;
		border-radius: 3px;
		margin: 10px;
		padding: 3px;
		pointer-events: none;
	}
</style>
