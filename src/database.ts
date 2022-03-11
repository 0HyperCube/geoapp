// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
	getDatabase,
	connectDatabaseEmulator,
	set,
	onValue,
	ref,
	Database,
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
import { randomInt } from "mathjs";
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
export let province_owners = writable(new Map());
export let user_territory_colours = writable(new Map());

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
		gc: Math.random() * 100,
		email: user.email,
	});
}

function on_login() {
	const user_id = user.uid;
	// set(ref(db, "users/" + "bob"), {
	// 	troops: 45,
	// });

	onValue(ref(db, `users/${user_id}/gc`), (snapshot) => {
		balance.set(snapshot.val() as number);
		if (!balance) new_user();
	});
	onValue(ref(db, `territories`), (snapshot) => {
		let new_territory_colours = new Map();
		let new_province_owners = new Map();
		snapshot.forEach((d) => {
			let territory_owner = d.key;
			console.log(territory_owner);
			let inf = d.val();
			if (inf.colour) new_territory_colours.set(territory_owner, inf.colour);
			else {
				let new_colour = `rgb(${randomInt(0, 255)},${randomInt(
					0,
					255
				)},${randomInt(0, 255)})`;
				set(ref(db, `territories/${territory_owner}/colour`), new_colour);
			}
			d.child("provinces").forEach((province) => {
				new_province_owners.set(province.val(), territory_owner);
			});
		});
		console.log(new_province_owners);
		user_territory_colours.set(new_territory_colours);
		province_owners.set(new_province_owners);
	});
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
}
