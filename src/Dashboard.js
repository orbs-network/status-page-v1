import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CheckCircleOutlined from '@material-ui/icons/CheckCircleOutlined';
import AssignmentOutlined from '@material-ui/icons/AssignmentOutlined';
import EquializerOutlined from '@material-ui/icons/EqualizerOutlined';
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
                    <td className="green card">
                        <div class="card-text">
                            {BlockHeight}<br/>{Version}
                        </div>
                        <div class="card-icons">
                            <EquializerOutlined />
                            <AssignmentOutlined />
                        </div>
                    </td>
                )
            });

            const services = (
                <td className="green card">
                    <CheckCircleOutlined tooltip="Management Service" />
                    <CheckCircleOutlined tooltip="Signer Service" />
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
