import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { Table, TableBody, TableCell } from '@material-ui/core';
import { map } from 'lodash';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    paper: {
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
}));

export default class Dashboard extends React.Component {
    constructor(props) {
        super(props);
    }

    FormRow() {
        return (
            <React.Fragment>
                <Grid item xs={4}>
                    <Paper >item</Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper>item</Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper>item</Paper>
                </Grid>
            </React.Fragment>
        );
    }

    render() {
        const rows = this.props.data.map(({ validator, management, vchains }, index) => {
            // const vchains = map(management.CurrentVirtualChains, (value, key) => {
            //     return (
            //         <Card></Card>
            //     )
            // })

            const vchainCards = map(vchains, ({ BlockHeight, Version, Commit }) => {
                return (
                    <Grid item xs={2}><Card>{BlockHeight}<br/>{Version}</Card></Grid>
                )
            });

            const xs = 2 + 2 * Object.keys(vchains).length;

console.log(xs,)
            return (
                <Grid container item xs={xs} spacing={0} key={validator.Name}>
                    <Grid item xs={2}>
                        <Card >{validator.Name}<br/>{validator.IP}</Card>
                    </Grid>
                    {vchainCards}
                </Grid>
            )
        });

        return (
            <div>
                <Grid container spacing={1}>
                    {rows}
                </Grid>
            </div>
        );
    }
}
