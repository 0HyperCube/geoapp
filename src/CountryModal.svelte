<script lang="ts">
	import { increment, push, ref, remove, set, update } from "firebase/database";

	import {
		user_id,
		db,
		logged_in,
		province_owners,
		actions,
		use_action,
		player_units,
		unit_values,
		attack_order,
		province_owner_uuid,
	} from "./database";
	import { province_neighbours } from "./countries";
	import Modal from "./Modal.svelte";
	import { ceil, min, sum, unit } from "mathjs";

	export let province = "";
	export let regions = new Map();
	export let coastal_regions = [];

	export let modal_open = false;
	let attack_open = false;

	$: coastal = coastal_regions.includes(province);
	$: owner = $province_owners.get(province);
	$: scoutable = count_exploration(province, $province_owners);
	$: neighbours_user =
		province &&
		province_neighbours
			.get(province)
			.find((neighbour) => $province_owners.get(neighbour) === $user_id);
	$: attackable = owner && owner !== $user_id && (coastal || neighbours_user);

	function conquor() {
		use_action();
		push(ref(db, `territories/${$user_id}/provinces`), province);
	}
	function explore() {
		use_action();
		let explore_from = [province];
		let discovered_count = 0;
		while (explore_from.length > 0 && discovered_count < 4) {
			province_neighbours.get(explore_from.pop()).forEach((new_province) => {
				if (discovered_count < 4 && !$province_owners.get(new_province)) {
					explore_from.push(new_province);
					push(ref(db, `territories/${$user_id}/provinces`), new_province);
					$province_owners.set(new_province, $user_id);
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

	let [attacker_hp, defender_hp] = [0, 0];
	let [attacker_losses, defender_losses] = [
		new Map<string, number>(),
		new Map<string, number>(),
	];

	function attack() {
		use_action();

		function apply_damage(
			attacker_units: Map<string, number>,
			defender_units: Map<string, number>
		): [number, Map<string, number>, {}] {
			if (!defender_units) {
				return [0, new Map(), {}];
			}

			let defender_hp = new Map<string, number>();
			defender_units.forEach((amount, type) => {
				defender_hp.set(type, unit_values.get(type).hp * amount);
			});

			attack_order.forEach((attacking_type) => {
				let attackers_left = attacker_units?.get(attacking_type) ?? 0;
				attack_order.forEach((defending_type) => {
					let hp = defender_hp.get(defending_type);
					let damage_per_attacker = unit_values
						.get(attacking_type)
						.damage.get(defending_type);
					if (damage_per_attacker && hp) {
						let units_used = min(attackers_left, hp / damage_per_attacker);
						attackers_left -= units_used;
						defender_hp.set(
							defending_type,
							hp - units_used * damage_per_attacker
						);
					}
				});
			});

			let losses = new Map<string, number>();
			let losses_update = {};
			defender_units.forEach((amount, unit) => {
				let hp = defender_hp.get(unit);
				let hp_per_unit = unit_values.get(unit).hp;
				let lost = amount - ceil(hp / hp_per_unit);
				losses.set(unit, lost);
				losses_update[unit] = increment(-lost);
			});

			let total_hp = 0;
			defender_hp.forEach((hp) => {
				total_hp += hp;
			});

			return [total_hp, losses, losses_update];
		}

		let defender = owner;

		let attacker_units = $player_units.get($user_id);
		let defender_units = $player_units.get(defender);

		let [attacker_update, defender_update] = [{}, {}];
		[defender_hp, defender_losses, defender_update] = apply_damage(
			attacker_units,
			defender_units
		);
		[attacker_hp, attacker_losses, attacker_update] = apply_damage(
			defender_units,
			attacker_units
		);

		update(ref(db, `units/${$user_id}`), attacker_update);
		update(ref(db, `units/${defender}`), defender_update);

		if (attacker_hp > defender_hp) {
			push(ref(db, `territories/${$user_id}/provinces`), province);

			let province_id = $province_owner_uuid.get(province);
			console.log(province_id);
			remove(ref(db, `territories/${defender}/provinces/${province_id}`));
			$province_owners.set(province, $user_id);
		}

		console.log(defender_hp, defender_losses);
		console.log(attacker_hp, attacker_losses);

		attack_open = true;
		modal_open = false;
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
		{#if $logged_in && !owner && coastal && $actions > 0}
			<button on:click={conquor}>Explore via sea</button>
		{:else if $logged_in && owner === $user_id && scoutable > 0 && $actions > 0}
			<button on:click={explore}
				>Scout {scoutable} neighbour{scoutable == 1 ? "" : "s"}</button
			>
		{:else if attackable && $actions > 0}
			<button on:click={attack}
				>Attack {neighbours_user ? "" : "via sea"}</button
			>
		{:else if $actions === 0 && $logged_in && ((!owner && coastal) || (owner === $user_id && scoutable > 0) || attackable)}
			<span class="button-like">No actions left</span>
		{/if}
	</span>
</Modal>
<Modal bind:modal_open={attack_open}>
	<span slot="title">
		{attacker_hp > defender_hp ? "Victory!" : "Defeat!"}
	</span>
	<div slot="conent">
		<p>Location: {province.replaceAll("_", " ")}</p>
		<h2>Attacker losses</h2>
		{#each [...unit_values.keys()] as unit}
			{#if attacker_losses.get(unit)}
				<p>{unit}: {attacker_losses.get(unit)}</p>
			{/if}
		{/each}
		<p><b>Remaining hp: {attacker_hp}</b></p>
		<h2>Defender losses</h2>
		{#each [...unit_values.keys()] as unit}
			{#if defender_losses.get(unit)}
				<p>{unit}: {defender_losses.get(unit)}</p>
			{/if}
		{/each}
		<p><b>Remaining hp: {defender_hp}</b></p>
	</div>
	<span slot="action" />
</Modal>

<style>
	p {
		margin: 0;
	}
	button,
	.button-like {
		margin: 5px;
	}
	h2 {
		font-size: 20px;
		margin: 10px 0 5px 0;
	}
</style>
