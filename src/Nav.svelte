<script lang="ts">
	import {
		getAuth,
		signInWithPopup,
		signOut,
		GithubAuthProvider,
		onAuthStateChanged,
		User,
	} from "firebase/auth";

	export let on_login = (_user: User) => {};

	const provider = new GithubAuthProvider();

	let user_id = undefined;
	export let logged_in = false;

	export function init_auth() {
		const auth = getAuth();

		onAuthStateChanged(auth, (user) => {
			if (user) {
				on_login(user);
				user_id = user.uid;
				logged_in = true;
			} else {
				logged_in = false;
			}
		});
	}

	function login() {
		const auth = getAuth();

		signInWithPopup(auth, provider).catch((error) => {
			alert(`Error logging in: ${error.errorCode}: ${error.errorMessage}`);
		});
	}

	function logout() {
		const auth = getAuth();

		signOut(auth).catch((error) => {
			alert(`Error logging out: ${error.errorCode}: ${error.errorMessage}`);
		});
	}
</script>

<nav>
	<span id="title">Geoclash Console</span>
	{#if logged_in}
		<span>{user_id}</span>
	{/if}
	<button on:click={logged_in ? logout : login}
		>{logged_in ? "Logout" : "Login"}</button
	>
</nav>
<div class="nav-spacer" />

<style>
	nav {
		margin: 0;
		background-color: #252423;
		display: flex;
		position: fixed;
		width: 100%;
	}
	.nav-spacer {
		height: 62px;
	}
	span {
		color: rgb(134, 211, 162);
		font-size: 26px;
		font-weight: 100;
		margin: 15px;
	}
	#title {
		flex-grow: 1;
	}
</style>
