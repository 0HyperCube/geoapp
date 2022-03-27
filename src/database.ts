// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
	getDatabase,
	connectDatabaseEmulator,
	set,
	onValue,
	ref,
	Database,
	update,
	increment,
	get,
} from "firebase/database";
import {
	getAuth,
	GithubAuthProvider,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
	User,
} from "firebase/auth";

import { writable } from "svelte/store";
import { floor, randomInt } from "mathjs";
import { coastal_regions, province_neighbours } from "./countries";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyASO0gfOvH1hoZ7_TRMviSO2AdxOKWo-V8",
	authDomain: "geoclash-3ed30.firebaseapp.com",
	databaseURL:
		"https://geoclash-3ed30-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "geoclash-3ed30",
	storageBucket: "geoclash-3ed30.appspot.com",
	messagingSenderId: "209915577232",
	appId: "1:209915577232:web:bb5f14ccad37c8eb2f2915",
};

export let db: Database;

export let user: User;
export let user_id = writable("");
export let logged_in = writable(false);

export let balance = writable(0);
export let development_level = writable(0);
export let income_per_province = writable(0);
let internal_icome_per_province = 10;

let internal_province_owners = new Map<string, string>();

export let actions = writable(0);
export let province_owners = writable(new Map<string, string>());
export let province_owner_uuid = writable(new Map<string, string>());
export let user_territory_colours = writable(new Map<string, string>());

let internal_provinces_count = new Map<string, number>();
let user_economic_hubs = [] as string[];
export let economic_hub_neighbours_count = writable(0);
let user_military_hubs = 0;
export let provinces_count = writable(new Map<string, number>());
export let coastal_provinces_count = writable(new Map<string, number>());
export let player_units = writable(new Map<string, Map<string, number>>());
export let unit_limits = writable({ total_army: 0, total_naval_army: 0 });
export let military_centres = writable(new Map<string, string>());
export let economic_centres = writable(new Map<string, string>());

export let owned_provinces_count = writable(0);
// owned_provinces_count.subscribe;

export let income = writable(0);

function update_income() {
	let new_economic_bonuses = new Set(
		user_economic_hubs
			.flatMap((province) => province_neighbours.get(province))
			.filter(
				(neighbour) => internal_province_owners.get(neighbour) === user.uid
			)
	).size;
	economic_hub_neighbours_count.set(new_economic_bonuses);
	income.set(
		internal_icome_per_province *
			(internal_provinces_count.get(user.uid) + new_economic_bonuses)
	);
}

export const attack_order = [
	"Submarine",
	"Airborne",
	"Naval",
	"Tank",
	"Vehicular",
	"Infantry",
];

function damage(
	infantry: number,
	vehicular: number,
	tank: number,
	naval: number,
	airborne: number,
	submarine: number
): Map<string, number> {
	return new Map([
		["Infantry", infantry],
		["Vehicular", vehicular],
		["Tank", tank],
		["Naval", naval],
		["Airborne", airborne],
		["Submarine", submarine],
	]);
}

export const unit_values = new Map([
	[
		"Infantry",
		{
			cost: 10,
			force_limit: 2,
			requires_coast: false,
			hp: 2,
			damage: damage(1, 0, 0, 0, 0, 0),
		},
	],
	[
		"Vehicular",
		{
			cost: 25,
			force_limit: 1,
			requires_coast: false,
			hp: 7,
			damage: damage(3, 2, 1, 0, 0, 0),
		},
	],
	[
		"Tank",
		{
			cost: 50,
			force_limit: 0.2,
			requires_coast: false,
			hp: 50,
			damage: damage(10, 7, 5, 0, 0, 0),
		},
	],
	[
		"Naval",
		{
			cost: 200,
			force_limit: 0.5,
			requires_coast: true,
			hp: 20,
			damage: damage(0, 0, 0, 10, 7, 0),
		},
	],
	[
		"Airborne",
		{
			cost: 250,
			force_limit: 0.1,
			requires_coast: false,
			hp: 25,
			damage: damage(20, 20, 10, 20, 10, 15),
		},
	],
	[
		"Submarine",
		{
			cost: 500,
			force_limit: 0.05,
			requires_coast: true,
			hp: 100,
			damage: damage(0, 0, 0, 50, 25, 100),
		},
	],
]);

const provider = new GithubAuthProvider();

export function login() {
	const auth = getAuth();

	signInWithPopup(auth, provider).catch((error) => {
		alert(`Error logging in: ${error.errorCode}: ${error.errorMessage}`);
	});
}

export function logout() {
	const auth = getAuth();

	signOut(auth).catch((error) => {
		alert(`Error logging out: ${error.errorCode}: ${error.errorMessage}`);
	});
}

function new_user() {
	set(ref(db, `users/${user.uid}`), {
		gc: 0,
		email: user.email,
	});
}

function on_login() {
	const user_id = user.uid;

	onValue(ref(db, `users/${user_id}/gc`), (snapshot) => {
		let new_balance = snapshot.val() as number;
		balance.set(new_balance);
		if (!new_balance) new_user();
	});

	let development_ref = ref(db, `development_levels/${user_id}`);
	onValue(development_ref, (snapshot) => {
		let new_development_level = snapshot.val() as number;

		if (new_development_level === null) set(development_ref, 0);
		else development_level.set(new_development_level || 0);
	});

	let actions_ref = ref(db, `actions/${user_id}`);
	onValue(actions_ref, (snapshot) => {
		let new_actions = snapshot.val() as number;

		if (new_actions === null) set(actions_ref, 5);
		else actions.set(new_actions);
	});

	let units_ref = ref(db, `units/`);
	onValue(units_ref, (snapshot) => {
		let all_units = new Map<string, Map<string, number>>();
		snapshot.forEach((snapshot) => {
			let new_units = snapshot.val();
			let owner = snapshot.key;
			console.log(new_units);
			if (new_units !== null) {
				let new_units_map = new Map<string, number>();
				snapshot.forEach((child) => {
					new_units_map.set(child.key, child.val());
				});

				if (user.uid === owner) {
					let total_army = 0;
					let total_naval_army = 0;
					new_units_map.forEach((count, unit) => {
						let unit_value = unit_values.get(unit);
						let total_provinces = count * (1 / unit_value.force_limit);
						total_army += total_provinces;
						if (unit_value.requires_coast) {
							total_naval_army += total_provinces;
						}
					});

					unit_limits.set({ total_army, total_naval_army });
				}

				all_units.set(owner, new_units_map);
			}
		});
		player_units.set(all_units);
	});

	let last_ref = ref(db, `meta/last_payent`);
	onValue(last_ref, async (snapshot) => {
		// Gets the days since the unix epoch
		let days = floor(new Date().getTime() / (1000 * 60 * 60 * 24));
		let last_update = snapshot.val() as number;
		if (last_update) {
			let delta = days - last_update;
			if (delta > 0) {
				let updates = {};
				updates[`meta/last_payent`] = days;

				let development_levels = await get(ref(db, `development_levels`));
				development_levels.forEach((child) => {
					let development_level = child.val() || 0;

					let user = child.key;
					let provinces = internal_provinces_count.get(user) || 0;

					updates[`users/${user}/gc`] = increment(
						(10 + development_level) * provinces * delta
					);
					updates[`actions/${user}`] = 5;
				});

				update(ref(db), updates);
			}
		} else {
			set(last_ref, days);
		}
	});

	development_level.subscribe((lvl) => {
		internal_icome_per_province = lvl + 10;
		income_per_province.set(lvl + 10);
		update_income();
	});

	provinces_count.subscribe((count) =>
		owned_provinces_count.set(count.get(user.uid) || 0)
	);
}

function on_load() {
	onValue(ref(db, `territories`), (snapshot) => {
		let new_territory_colours = new Map();
		internal_province_owners = new Map();
		internal_provinces_count = new Map();
		let new_coastal_province_count = new Map();
		let new_province_owner_uuid = new Map();
		snapshot.forEach((snapshot) => {
			let territory_owner = snapshot.key;
			let provinces = snapshot.child("provinces");

			internal_provinces_count.set(territory_owner, provinces.size);

			let inf = snapshot.val();
			if (inf.colour) new_territory_colours.set(territory_owner, inf.colour);
			else {
				let new_colour = `rgb(${randomInt(0, 255)},${randomInt(
					0,
					255
				)},${randomInt(0, 255)})`;
				set(ref(db, `territories/${territory_owner}/colour`), new_colour);
				new_territory_colours.set(territory_owner, new_colour);
			}

			let total_coastal_provinces = 0;
			provinces.forEach((province_snapshot) => {
				let province = province_snapshot.val();
				internal_province_owners.set(province, territory_owner);
				new_province_owner_uuid.set(province, province_snapshot.key);
				if (coastal_regions.includes(province)) total_coastal_provinces += 1;
			});
			new_coastal_province_count.set(territory_owner, total_coastal_provinces);
		});
		console.log(new_province_owner_uuid);
		user_territory_colours.set(new_territory_colours);
		province_owners.set(internal_province_owners);
		province_owner_uuid.set(new_province_owner_uuid);
		provinces_count.set(internal_provinces_count);
		coastal_provinces_count.set(new_coastal_province_count);

		if (user.uid) update_income();
	});

	onValue(ref(db, `special_provinces/economic`), (snapshot) => {
		let new_economic_centres = new Map();
		user_economic_hubs = [] as string[];
		snapshot.forEach((current_user) => {
			current_user.forEach((child) => {
				let key = child.key;
				let province = child.val();
				new_economic_centres.set(province, key);

				if (current_user.key === user.uid) {
					user_economic_hubs.push(province);
				}
			});
		});
		economic_centres.set(new_economic_centres);

		if (user.uid) update_income();
	});
	onValue(ref(db, `special_provinces/military`), (snapshot) => {
		let new_military_centres = new Map();
		snapshot.forEach((user) => {
			user.forEach((child) => {
				let key = child.key;
				let province = child.val();
				new_military_centres.set(province, key);
			});
		});
		military_centres.set(new_military_centres);
	});
}

export function use_action() {
	set(ref(db, `actions/${user.uid}`), increment(-1));
}

function init_auth() {
	const auth = getAuth();
	console.log("init auth");

	onAuthStateChanged(auth, (new_user) => {
		if (new_user) {
			console.log("Logged in");
			user = new_user;
			user_id.set(new_user.uid);
			on_login();

			logged_in.set(true);
		} else {
			logged_in.set(false);
		}
	});
}

export function initalise_database() {
	// Initialize Firebase
	const app = initializeApp(firebaseConfig);
	db = getDatabase(app);
	if (location.hostname === "localhost") {
		// Point to the RTDB emulator running on localhost.
		connectDatabaseEmulator(db, "localhost", 8085);
	}
	init_auth();
	on_load();
}
