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
		ref,
	} from "firebase/database";

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

	// Initialize Firebase
	const app = initializeApp(firebaseConfig);
	const db = getDatabase(app);
	if (location.hostname === "localhost") {
		// Point to the RTDB emulator running on localhost.
		connectDatabaseEmulator(db, "localhost", 8085);
	}

	// Extracts localhost:8080/?token=hello
	let status = "";
	const params = new URLSearchParams(window.location.search);
	const token = params.get("token");

	if (token) {
		status = `Welcome, ${token}`;
	} else {
		status = "Please use your custom link to sign in.";
	}

	set(ref(db, "users/" + "bob"), {
		troops: 45,
	});

	let map_expanded = false;
</script>

<div class="document">
	<Nav />
	<main class:map_expanded>
		{#if !map_expanded}
			<h2>Finance</h2>
			<div class="card">
				<Units />
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
