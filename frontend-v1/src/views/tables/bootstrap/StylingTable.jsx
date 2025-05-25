import React from 'react';

// react bootstrap
import { Row, Col, Card, Table } from 'react-bootstrap';

// project imports
import { TableData } from 'data/tableData';

// -----------------------|| STYLING TABLE ||-----------------------//

const StylingTable = () => (
  <Row noGutters>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Default Styling</Card.Title>
          <span className="d-block m-t-5">This is default table style</span>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Table Footer Styling</Card.Title>
          <span className="d-block m-t-5">
            use class <code>table-info </code> with <code>tfoot</code> element
          </span>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Table Footer Styling</Card.Title>
          <span className="d-block m-t-5">
            use class <code>table-info </code> with <code>tfoot</code> element
          </span>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-info">
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tfoot>
          </Table>
        </Card.Body>
      </Card>
    </Col>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Custom Table Color</Card.Title>
          <span className="d-block m-t-5">
            use class <code>table-*</code> with <code>Table</code> element
          </span>
        </Card.Header>
        <Card.Body>
          <Table responsive className="table-styling table-info">
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
    <Col md={6} sm={12}>
      <Card>
        <Card.Header>
          <Card.Title as="h5">Custom Table Color with Hover and Stripped</Card.Title>
          <span className="d-block m-t-5">
            use class <code>table-*</code> with <code>Table</code> element
          </span>
        </Card.Header>
        <Card.Body>
          <Table variant="primary" striped hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {(TableData || []).map((object, key) => (
                <tr key={key}>
                  <th scope="row" key={key}>
                    {object.id}
                  </th>
                  <td>{object.firstName}</td>
                  <td>{object.lastName}</td>
                  <td>{object.username}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

export default StylingTable;
