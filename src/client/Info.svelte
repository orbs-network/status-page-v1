<script>
  import { isEmpty } from "lodash";

  export let data;
  export let vcid;
  export let host;

  let { commit, blockHeight, version, status } = data;

  const shortCommit = !_.isEmpty(commit) ? commit.substring(0, 8) : "";
  const githubLink = `https://github.com/orbs-network/orbs-network-go/commit/${shortCommit}`;
  const metricsLink = `http://${host}/vchains/${vcid}/metrics`;
</script>

<td class={status || 'yellow'}>
  {#if isEmpty(data)}
    <a href={metricsLink} title={data.created_at} target="_blank">no data</a>
  {:else}
    <a href={metricsLink} title={data.created_at} target="_blank">
      {blockHeight}
    </a>
    <br />
    <a href={githubLink} alt="{version} {shortCommit}" target="_blank">
      {version}
    </a>
  {/if}
</td>
