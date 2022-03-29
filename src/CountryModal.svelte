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
		economic_centres,
		military_centres,
		balance,
		income,
		user_military_hubs,
	} from "./database";
	import { province_centres, province_neighbours } from "./countries";
	import Modal from "./Modal.svelte";
	import math, { ceil, distance, min, sum, unit } from "mathjs";

	export let province = "";
	export let regions = new Map();
	export let coastal_regions = [];

	export let modal_open = false;
	let attack_open = false;

	$: coastal = coastal_regions.includes(province);
	$: owner = $province_owners.get(province);
	$: is_owned = owner === $user_id;
	$: scoutable = count_exploration(province, $province_owners);
	$: neighbours_user =
		province &&
		province_neighbours
			.get(province)
			.find((neighbour) => $province_owners.get(neighbour) === $user_id);
	$: attackable = owner && owner !== $user_id && (coastal || neighbours_user);
	$: economic_hub = $economic_centres.has(province);
	$: military_hub = $military_centres.has(province);
	$: hub_cost = ceil($income * 5) / 100;

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

	let attacker_boost = 0;
	let defender_boost = 0;

	function build_economic_hub() {
		use_action();
		set(ref(db, `users/${$user_id}/gc`), increment(-hub_cost));
		push(ref(db, `special_provinces/economic/${$user_id}`), province);
		$economic_centres.set(province, null);
		economic_hub = true;
	}

	function build_military_hub() {
		use_action();
		set(ref(db, `users/${$user_id}/gc`), increment(-hub_cost));
		push(ref(db, `special_provinces/military/${$user_id}`), province);
		$military_centres.set(province, null);
		military_hub = true;
	}

	function attack() {
		use_action();

		function apply_damage(
			attacker_units: Map<string, number>,
			defender_units: Map<string, number>,
			military_hubs: string[]
		): [number, Map<string, number>, {}, number] {
			let attacker_boost = 0;
			let centre = province_centres.get(province);
			military_hubs.forEach((location) => {
				let location_centre = province_centres.get(location);
				if (distance(centre, location_centre) < 100) {
					attacker_boost += 20;
				} else {
					attacker_boost += 5;
				}
			});

			if (!defender_units) {
				return [0, new Map(), {}, attacker_boost];
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
							hp - units_used * damage_per_attacker * (1 + attacker_boost / 100)
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

			return [total_hp, losses, losses_update, attacker_boost];
		}

		let defender = owner;

		let attacker_units = $player_units.get($user_id);
		let defender_units = $player_units.get(defender);

		let [attacker_update, defender_update] = [{}, {}];
		[defender_hp, defender_losses, defender_update, attacker_boost] =
			apply_damage(
				attacker_units,
				defender_units,
				user_military_hubs.get($user_id)
			);
		[attacker_hp, attacker_losses, attacker_update, defender_boost] =
			apply_damage(
				defender_units,
				attacker_units,
				user_military_hubs.get(defender)
			);

		update(ref(db, `units/${$user_id}`), attacker_update);
		update(ref(db, `units/${defender}`), defender_update);

		if (attacker_hp > defender_hp) {
			push(ref(db, `territories/${$user_id}/provinces`), province);

			let province_id = $province_owner_uuid.get(province);
			console.log(province_id);
			remove(ref(db, `territories/${defender}/provinces/${province_id}`));

			if ($economic_centres.has(province)) {
				let id = $economic_centres.get(province);
				remove(ref(db, `special_provinces/economic/${defender}/${id}`));
			}

			if ($military_centres.has(province)) {
				let id = $military_centres.get(province);
				remove(ref(db, `special_provinces/military/${defender}/${id}`));
			}

			$province_owners.set(province, $user_id);
		}

		console.log(defender_hp, defender_losses);
		console.log(attacker_hp, attacker_losses);

		attack_open = true;
		modal_open = false;
	}

	$: attacker_has_lost_units = Array.from(attacker_losses.values()).every(
		(value) => value === 0
	);
	$: defender_has_lost_units = Array.from(defender_losses.values()).every(
		(value) => value === 0
	);
</script>

<Modal bind:modal_open>
	<span slot="title">{province.replaceAll("_", " ")} Province</span>
	<div slot="conent">
		<p>Region: {regions.get(province).name}</p>
		<p>{coastal ? "Coastal" : "Landlocked"}</p>
		<p>Owner: {owner ? owner : "None"}</p>
		{#if economic_hub}<p>Economic hub</p>
		{:else if military_hub}<p>Military hub</p>
		{:else if is_owned}
			<p>Buy a hub for {hub_cost}gc and 1 action. You have {$balance}gc</p>
		{/if}
	</div>
	<span slot="action">
		{#if $logged_in && !owner && coastal && $actions > 0}
			<button on:click={conquor}>Explore via sea</button>
		{:else if $logged_in && is_owned && $actions > 0}
			{#if scoutable > 0}
				<button on:click={explore}
					>Scout {scoutable} neighbour{scoutable == 1 ? "" : "s"}</button
				>
			{/if}
			{#if hub_cost <= $balance && !economic_hub && !military_hub}
				<button on:click={build_economic_hub}>Economic hub</button>
				<button on:click={build_military_hub}>Military hub</button>
			{/if}
		{:else if attackable && $actions > 0}
			<button on:click={attack}
				>Attack {neighbours_user ? "" : "via sea"}</button
			>
		{:else if $actions === 0 && $logged_in && ((!owner && coastal) || (is_owned && scoutable > 0) || attackable)}
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
		<p>Attacker boost +{attacker_boost}%</p>
		<p>Defender boost +{defender_boost}%</p>
		<h2>Attacker losses</h2>
		{#if attacker_has_lost_units}
			{#each [...unit_values.keys()] as unit}
				{#if attacker_losses.get(unit)}
					<p>{unit}: {attacker_losses.get(unit)}</p>
				{/if}
			{/each}
		{:else}
			<p><i>No losses</i></p>
		{/if}
		<p><b>Remaining hp: {attacker_hp}</b></p>
		<h2>Defender losses</h2>
		{#if defender_has_lost_units}
			{#each [...unit_values.keys()] as unit}
				{#if defender_losses.get(unit)}
					<p>{unit}: {defender_losses.get(unit)}</p>
				{/if}
			{/each}
		{:else}
			<p><i>No losses</i></p>
		{/if}
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
