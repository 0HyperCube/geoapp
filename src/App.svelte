<script lang="ts">
	import Map from "./Map.svelte";
	import Auth from "./Auth.svelte";

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

	set(ref(db, "users/" + "bob"), {
		troops: 45,
	});
</script>

<main>
	<h1>Geoclash</h1>

	<Map />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (max-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
