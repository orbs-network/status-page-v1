import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Paper';
import CheckCircleOutlined from '@material-ui/icons/CheckCircleOutlined';
import { map } from 'lodash';
import moment from "moment";


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

    render() {
        const width = 100/(this.props.vchains.length + 2);

        const headers = map(this.props.vchains, (Vchain) => {
            const style = {
                width: `${width}%`,
            }
            return (
                <td style={style}>{Vchain}</td>
            )
        });
        console.log(this.props.data[0].management.CurrentVirtualChains)

        const vchainDetails = map(this.props.data[0].management.CurrentVirtualChains, ({Expiration, RolloutGroup}, Vchain) => {
            const style = {
                width: `${width}%`,
            }

            const dateFormat = "MM-DD-YYYY";

            return (
                <td style={style}>{moment(Expiration).format(dateFormat)} {RolloutGroup}</td>
            )
        });

        const rows = this.props.data.map(({ validator, management, vchains }, index) => {
            const vchainCards = map(vchains, ({ BlockHeight, Version, Commit }) => {
                return (
                    <td><Card>{BlockHeight}<br/>{Version}</Card></td>
                )
            });

            const services = (
                <td>
                    <Card>
                        <CheckCircleOutlined tooltip="Management Service" />
                        <CheckCircleOutlined tooltip="Signer Service" />
                    </Card>
                </td>
            );

            return (
                <tr>
                    <td>{validator.Name}<br/>{validator.IP}</td>
                    {services}
                    {vchainCards}
                </tr>
            )
        });

        return (
            <table style={{width: "100%"}}>
            <thead style={{"font-weight": "bold"}}>
                <tr>
                    <td></td>
                    <td>Node Services</td>
                    {headers}                
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    {vchainDetails}
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
            </table>
        );
    }
}
