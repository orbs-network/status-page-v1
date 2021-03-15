<script>
  import { size, isEmpty, keys, get, find } from "lodash";
  import { onMount } from "svelte";
  import Info from "./Info.svelte";
  import Spinner from "./Spinner.svelte";

  let isFetched = false;

  let vchains = [];
  let status = {};
  let descriptions = {};
  let hosts = {};
  let prisms = {};  

  const getDescription = vcid => descriptions[vcid] || "";
  const getPrismUrl = vcid => prisms[vcid] || "";

  const getData = (validator, vcid) => {
    try {
      return status[validator][vcid] || {};
    } catch (e) {
      return {};
    }
  };

  const getHost = validator => get(find(hosts, { name: validator }), "host");

  const fetchData = async () => {
    try {
      const response = await fetch("/status.json");
      const updatedStatus = await response.json();

      if (!isEmpty(keys(updatedStatus.status))) {
        vchains = updatedStatus.vchains;
        status = updatedStatus.status;
        descriptions = updatedStatus.descriptions;
        hosts = updatedStatus.hosts;
        prisms = updatedStatus.prisms;
      }
      isFetched = true;
    } catch (e) {
      console.log("Failed to fetch data", e);
    }
  };

  onMount(fetchData);
</script>

<style>
  .glass {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }    
</style>

<div>
  <div class="header">
    <a href="/">
      <img alt="orbs-logo" src="/0RBS-white-version.png" />
    </a>
    <h1>Network Status</h1>
  </div>

  {#if !isFetched}
    <div class="glass">
      <Spinner />
    </div>
  {/if}

  <table>
    <tr class="thead">
      <td>
        <!-- empty space -->
      </td>
      {#each vchains as vcid}
        <td>
          <span class="vcid">{vcid}</span>
          <br />
          {#if getPrismUrl(vcid) == ''}
            <span class="description">{getDescription(vcid)}</span>
          {:else}
            <a href={getPrismUrl(vcid)} target="_blank">
              <span class="description">{getDescription(vcid)}</span>
            </a>
          {/if}
        </td>
      {/each}
    </tr>

    {#each keys(status) as validator}
      <tr>
        <td class="node-name">{validator}</td>
        {#each vchains as vcid}
          <Info
            data={getData(validator, vcid)}
            {vcid}
            host={getHost(validator)} />
        {/each}
      </tr>
    {/each}
  </table>
</div>
