import React from 'react';

// project imports
import PaginationTable from './components/PaginationTable';
import SelectableRowsTable from './components/SelectableRowsTable';
import SortingTable from './components/SortingTable';
import ExpandableRowsTable from './components/ExpandableRowsTable';

// -----------------------|| REACT TABLE ||-----------------------//

const ReactTable = () => (
  <>
    <PaginationTable />

    <SortingTable />

    <SelectableRowsTable />

    <ExpandableRowsTable />
  </>
);

export default ReactTable;
