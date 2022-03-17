<script lang="ts">
	import { logged_in, user_id, login, logout, actions } from "./database";

	let nav: HTMLElement;
	let spacer_height = 0;
</script>

<nav bind:clientHeight={spacer_height}>
	<span id="title">Geoclash Console</span>
	{#if $logged_in}
		<span>{$user_id}</span>
		<span>Actions: {$actions}</span>
	{/if}
	<button on:click={$logged_in ? logout : login}
		>{$logged_in ? "Logout" : "Login"}</button
	>
</nav>
<div style="height:{spacer_height}px" />

<style>
	nav {
		margin: 0;
		background-color: #252423;
		display: flex;
		position: fixed;
		width: 100%;
	}
	span {
		color: rgb(134, 211, 162);
		font-size: 22px;
		font-weight: 100;
		margin: 15px;
	}
	#title {
		flex-grow: 1;
	}
</style>
