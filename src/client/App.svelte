<script>
import { size, isEmpty } from "lodash";
import Info from "./Info.svelte";

export let vchains;
export let validators;

const getDescription = (vcid) => "";

const getData = (validator, vcid) => {
    return { blockHeight: 999999, version: "v1.3.6", status: "green" }
};
</script>

<div class="centeredDiv" style="width: {(size(vchains) + 1) * 150}px;">
    <div class="header">
        <a href="/"><img src="/0RBS-white-version.png"></a>
        <h1>
        Network Status
        </h1>
    </div>

    <table>
        <tr class="thead">
            <td><!-- empty space --></td>
            {#each vchains as vcid}                
                <td><span class="vcid">{vcid}</span>
                <br/><span class="description">{getDescription(vcid)}</span>
                </td>
            {/each}
        </tr>
    
        {#each validators as validator}
        <tr>
            <td class="node-name">{validator}</td>
            {#each vchains as vcid}
                <Info data={getData(validator, vcid)} vcid={vcid} host="test" />
            {/each}
        </tr>
        {/each}
    </table>
</div>