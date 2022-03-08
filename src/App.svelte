<script lang="ts">
	import Map from "./Map.svelte";
	import Units from "./Units.svelte";
	import Nav from "./Nav.svelte";

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
	import { onMount } from "svelte";
	import type { User } from "firebase/auth";

	let init_auth: () => void;

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

	let db: Database;

	onMount(async () => {
		// Initialize Firebase
		const app = initializeApp(firebaseConfig);
		db = getDatabase(app);
		if (location.hostname === "localhost") {
			// Point to the RTDB emulator running on localhost.
			connectDatabaseEmulator(db, "localhost", 8085);
		}

		init_auth();
	});

	function new_user(user: User) {
		set(ref(db, `users/${user.uid}`), {
			gc: Math.random() * 100,
			email: user.email,
		});
	}

	let balance = 0;
	let logged_in = false;

	function on_login(user: User) {
		const user_id = user.uid;
		// set(ref(db, "users/" + "bob"), {
		// 	troops: 45,
		// });

		onValue(ref(db, `users/${user_id}/gc`), (snapshot) => {
			balance = snapshot.val() as number;
			if (!balance) new_user(user);
		});
	}

	let map_expanded = false;
</script>

<div class="document">
	<Nav bind:init_auth {on_login} bind:logged_in />
	<main class:map_expanded>
		{#if !map_expanded && logged_in}
			<h2>Finance</h2>
			<div class="card">
				<table>
					<tr><td>Balance</td><td>{balance}</td></tr>
				</table>
			</div>
			<h2>Units</h2>
			<div class="card">
				<Units />
			</div>
		{/if}
		<h2>Map</h2>
		<div class="card" class:map_expanded>
			<Map bind:expanded={map_expanded} />
		</div>
	</main>
	<div class:map_expanded={!map_expanded} />
</div>

<style>
	.document {
		background-color: #1b1a19;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1em;
		align-items: stretch;
		min-height: 100%;

		margin: 0;
	}

	td {
		padding-right: 100px;
	}

	main {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1em;
		align-items: stretch;
	}

	h2 {
		text-align: left;
		margin-left: 1em;
		margin-bottom: -0.4em;
		margin-top: 0;
	}

	@media (max-width: 640px) {
		main {
			max-width: none;
		}
	}
	.card {
		background-color: #252423;
		border-radius: 3px;
		padding: 10px;
		margin: 0 1em;
	}
	.map_expanded {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}
</style>
