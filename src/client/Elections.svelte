<script>
  import { isEmpty } from "lodash";

  const status = "green";
  const electionsEndpoint = "/elections.json";

  let blockDecimalNumber;
  let ethLatestBlockTime;
  let nextElectionsBlock;
  let electionStatusDisplay = "Not started";

  const statuses = {
    eth: "green",
    elections: "green"
  };

  function pad(n) {
    return n < 10 ? "0" + n : n;
  }

  function formatTimestamp(ts) {
    const o = new Date(ts * 1000);

    const date = o.getDate();
    const month = o.getMonth();
    const year = o.getFullYear();
    const hour = o.getHours();
    const minute = o.getMinutes();
    const sec = o.getSeconds();

    return `${year}-${pad(month + 1)}-${pad(date)} ${pad(hour)}:${pad(
      minute
    )}:${pad(sec)}`;
  }

  async function getElectionsStats() {
    const resp = await fetch(electionsEndpoint);
    const { eth, elections } = await resp.json();

    blockDecimalNumber = eth.blockNumber;
    ethLatestBlockTime = formatTimestamp(eth.latestBlockTimestamp);
    if (eth.timeDriftInSeconds > 10 * 60) {
      statuses.eth = "red";
    }

    nextElectionsBlock = elections.next;
    if (elections.inProgress) {
      electionStatusDisplay = "Processing";
    }

    if (blockDecimalNumber > nextElectionsBlock && !elections.inProgress) {
      statuses.elections = "red";
    }

    if (blockDecimalNumber > nextElectionsBlock + 600 && elections.inProgress) {
      statuses.elections = "red";
    }
  }

  const ethPingPid = setInterval(getElectionsStats, 15 * 1000);
  getElectionsStats();
</script>

<table class="elections-table">
  <tr>
    <td class="node-name" style="width: 210px">&nbsp;</td>
    <td class="elections-status-caption">Ethereum Status</td>
    <td class={statuses.eth}>
      {blockDecimalNumber || 'N/A'}
      <br />
      {ethLatestBlockTime || 'N/A'}
    </td>
    <td class="elections-status-caption">Next Elections</td>
    <td class={statuses.elections}>
      {nextElectionsBlock || 'N/A'}
      <br />
      {electionStatusDisplay}
    </td>
    <td />
  </tr>
</table>

<div class="spacer" />
