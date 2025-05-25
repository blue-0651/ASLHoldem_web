import React, { useMemo } from 'react';

// react bootstrap
import { Row, Col, Card, Table } from 'react-bootstrap';

// third party
import DataTable from 'react-data-table-component';
import { Chance } from 'chance';

// project imports
import { makeData, generalColumns } from '../../data/reactTableData';

const totaldata = 10;
const chance = new Chance();
const ExpandedComponent = () => (
  <Table hover size="sm" bordered={false}>
    <thead>
      <tr>
        <th>#</th>
        <th>User Name</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>{chance.name()}</td>
        <td>{chance.email()}</td>
      </tr>
      <tr>
        <td>2</td>
        <td>{chance.name()}</td>
        <td>{chance.email()}</td>
      </tr>
    </tbody>
  </Table>
);

// -----------------------|| EXPANDABLE ROWS TABLE ||-----------------------//

const ExpandableRowsTable = () => {
  const dataArray = useMemo(() => makeData(totaldata), []);
  return (
    <>
      <Row noGutters>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Expandable Rows</h5>
              <small>
                Adding <code>expandableRows</code> attribute in table
              </small>
            </Card.Header>
            <Card.Body>
              <DataTable columns={generalColumns} data={dataArray} expandableRows expandableRowsComponent={ExpandedComponent} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ExpandableRowsTable;
