<script lang="ts">
	import { paths, regions, coastal_regions } from "./countries";
	import { abs } from "mathjs";

	import { RadioGroup, Radio } from "svelte-radio";
	import Tooltip from "./Tooltip.svelte";

	let path_entries = [...paths.entries()];

	export let expanded = false;

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

	// How zoomed in the user is
	let scale = 1;
	// Movement of countries on X
	let translation_x = 0;
	// Movement of countries on y
	let translation_y = 0;

	// If the user has transformed the viewport
	let has_transformed = false;

	// If there is a tooltip being displayed
	let tooltip_visible = false;
	// function to update tooltip location
	let update_tooltip_location;

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

	let viewmode = "regions";

	// Is the user panning?
	let panning = false;

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
			const scroll_speed = 1 / 300;

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
		update_tooltip_location(event);
	}
	function pointerUp() {
		panning = false;
	}
	function fill(name: string, viewmode: string) {
		// Normal fill
		if (viewmode == "default") {
			return "rgb(134, 211, 162)";
		} else if (viewmode == "regions") {
			return regions.get(name).colour;
		} else {
			return coastal_regions.includes(name)
				? "rgb(60, 127, 255)"
				: "rgb(134, 211, 162)";
		}
	}
</script>

<div class="options">
	<RadioGroup bind:value={viewmode} label="Radio group legend"
		><span slot="legend" style="padding-right:10px;">Viewmode:</span>
		<Radio label="Default" value="default" />
		<Radio label="Regions" value="regions" />
		<Radio label="Coastal" value="coastal" />
	</RadioGroup>
	<button id="expand-button" on:click={() => (expanded = !expanded)}
		>{expanded ? "Shrink" : "Expand"}</button
	>
</div>

<div
	bind:clientWidth={svg_width}
	bind:clientHeight={svg_height}
	style="flex-grow:1"
>
	<svg
		version="1.1"
		id="Map"
		xmlns="http://www.w3.org/2000/svg"
		preserveAspectRatio="xMinYMin"
		class="map"
		class:expanded-map={expanded}
		on:pointerdown={pointerDown}
		on:pointermove={pointerMove}
		on:pointerup={pointerUp}
		on:wheel={scroll}
		on:mouseleave={() => {
			tooltip_visible = false;
		}}
		bind:this={svg_element}
	>
		<title
			>{viewmode == "regions" ? "Map of regions" : "Map of the world"}</title
		>
		<g
			transform="scale({scale}) translate({translation_x},{translation_y})"
			id="country-group"
		>
			{#each path_entries as [name, path]}
				<path
					id={name}
					d={path}
					style="fill: {fill(
						name,
						viewmode
					)}; fill-opacity: 1; stroke: rgb(0, 0, 0); touch-action: none;"
					stroke-width="0.2"
				/>
			{/each}
		</g>
	</svg>
</div>

<Tooltip bind:tooltip_visible bind:update_tooltip_location />

<style>
	.map {
		border: 1px solid grey;
		width: 100%;
		aspect-ratio: 1200/460;
	}
	.expanded-map {
		aspect-ratio: auto;
		height: calc(100% - 6px);
		width: calc(100% - 4px);
	}

	:global(.svelte-radio-group) {
		border: 0;
		padding: 0;
		display: inline;
	}

	:global(.svelte-radio) {
		display: inline;
	}

	:global(.svelte-radio label) {
		display: inline;
	}

	#expand-button {
		height: min-content;
		text-align: right;
	}
</style>
