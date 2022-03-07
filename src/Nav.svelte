<script lang="ts">
	import { getAuth, signInWithPopup, GithubAuthProvider } from "firebase/auth";

	const provider = new GithubAuthProvider();

	let user_id = undefined;

	function login() {
		const auth = getAuth();

		signInWithPopup(auth, provider)
			.then((result) => {
				console.log(result);
				// This gives you a GitHub Access Token. You can use it to access the GitHub API.
				const credential = GithubAuthProvider.credentialFromResult(result);
				const token = credential.accessToken;

				// The signed-in user info.
				const user = result.user;
				user_id = user.uid;
				console.log(user.uid);
				// ...
			})
			.catch((error) => {
				// Handle Errors here.
				const errorCode = error.code;
				const errorMessage = error.message;
				alert(`Error logging in: ${errorCode}: ${errorMessage}`);
			});
	}
</script>

<nav>
	<span id="title">Geoclash Console</span>
	{#if user_id}
		<span>{user_id}</span>
	{:else}
		<button on:click={login}>Login</button>
	{/if}
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
