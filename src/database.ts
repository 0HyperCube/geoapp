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
export let actions = writable(0);
export let province_owners = writable(new Map<string, string>());
export let user_territory_colours = writable(new Map<string, string>());
let internal_provinces_count = new Map<string, number>();
export let provinces_count = writable(new Map<string, number>());

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
}

function on_load() {
	onValue(ref(db, `territories`), (snapshot) => {
		let new_territory_colours = new Map();
		let new_province_owners = new Map();
		internal_provinces_count = new Map();
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

			provinces.forEach((province) => {
				new_province_owners.set(province.val(), territory_owner);
			});
		});
		console.log(new_province_owners);
		user_territory_colours.set(new_territory_colours);
		province_owners.set(new_province_owners);
		provinces_count.set(internal_provinces_count);
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
