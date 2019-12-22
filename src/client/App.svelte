<script>
import { size, isEmpty, keys, get, find } from "lodash";
import Info from "./Info.svelte";

let vchains = [];
let status = {};
let descriptions = {};
let hosts = {};

const getDescription = (vcid) => descriptions[vcid] || "";

const getData = (validator, vcid) => {
    try {
        return status[validator][vcid] || { };
    } catch (e) {
        return {};
    }
};

const getHost = (validator) => {
    return get(find(hosts, { name: validator }), "host");
};

const update = async () => {
    try {
        const response = await fetch("/status.json");        
        const updatedStatus = await response.json();
        if (!isEmpty(keys(updatedStatus.status))) {
            vchains = updatedStatus.vchains;
            status = updatedStatus.status;
            descriptions = updatedStatus.descriptions;
            hosts = updatedStatus.hosts;
        }
    } catch (e) {
        console.log("Failed to fetch data", e);
    }
}

update();
setInterval(update, 5000);
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
    
        {#each keys(status) as validator}
        <tr>
            <td class="node-name">{validator}</td>
            {#each vchains as vcid}
                <Info data={getData(validator, vcid)} vcid={vcid} host={getHost(validator)} />
            {/each}
        </tr>
        {/each}
    </table>
</div>