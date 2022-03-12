<script lang="ts">
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

<style>
	td {
		width: 180px;
	}
</style>
