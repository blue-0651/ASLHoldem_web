import React, { useMemo } from 'react';

// react bootstrap
import { Row, Col, Card } from 'react-bootstrap';

// third party
import DataTable from 'react-data-table-component';

// project imports
import { makeData, generalColumns } from '../../data/reactTableData';

const totaldata = 10;

// -----------------------|| SELECTABLE ROWS TABLE ||-----------------------//

const SelectableRowsTable = () => {
  const data = useMemo(() => makeData(totaldata), []);
  return (
    <>
      <Row noGutters>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Selectable Rows</h5>
              <small>
                Adding <code>selector: row =&gt; row.title</code> a table columns
              </small>
            </Card.Header>
            <Card.Body>
              <DataTable columns={generalColumns} data={data} selectableRows />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default SelectableRowsTable;
