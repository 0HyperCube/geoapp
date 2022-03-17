<script lang="ts">
	import {
		balance,
		development_level,
		provinces_count,
		user_id,
	} from "./database";

	$: per_province = 10 + $development_level;
	$: owned_provinces_count = $provinces_count.get($user_id) || 0;
	$: income = owned_provinces_count * per_province;
</script>

<table>
	<tr><td>Balance</td><td>{$balance}gc</td></tr>
	<tr><td class="spacer" /></tr>

	<tr><td>Development level</td><td>{$development_level}</td></tr>
	<tr><td>GC per province</td><td>{per_province}gc</td></tr>
	<tr><td>Provinces</td><td>{owned_provinces_count}</td></tr>
	<tr><td class="spacer" /></tr>

	<tr><td><b>Income per day</b></td><td><b>{income}gc</b></td></tr>
</table>

<style>
	td {
		width: 180px;
	}

	.spacer {
		padding-bottom: 10px;
	}
</style>
