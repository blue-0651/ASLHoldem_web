import React from 'react';
import { Card, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="mb-4">
          <Card.Body className="text-center">
            <h3 className="text-danger mb-3">오류가 발생했습니다</h3>
            <p className="text-muted mb-3">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <Button 
              variant="primary" 
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
            >
              페이지 새로고침
            </Button>
          </Card.Body>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 