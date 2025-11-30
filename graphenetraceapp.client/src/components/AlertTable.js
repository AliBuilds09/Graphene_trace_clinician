// src/components/AlertTable.js
import React from 'react';

const AlertTable = ({ alerts }) => {
    if (!alerts || alerts.length === 0) {
        return <p>No alerts at this time.</p>;
    }

    return (
        <table className="table table-hover table-bordered mb-4">
            <thead>
                <tr>
                    <th>Alert Message</th>
                    <th>Date & Time</th>
                </tr>
            </thead>
            <tbody>
                {alerts.map((alert) => (
                    <tr key={alert.id}>
                        <td className={alert.critical ? 'text-danger fw-bold' : ''}>
                            {alert.message}
                        </td>
                        <td>
                            <strong>{alert.datetime}</strong>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default AlertTable;
