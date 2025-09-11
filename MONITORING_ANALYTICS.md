# Hoyn QR System - Monitoring and Analytics Setup

## Vercel Analytics

### Enabling Vercel Analytics
Vercel Analytics is automatically enabled for projects deployed on Vercel. To access analytics data:

1. Go to your project dashboard on Vercel
2. Navigate to the "Analytics" tab
3. View real-time and historical data about your application's performance

### Web Vitals Monitoring
Vercel automatically tracks Core Web Vitals including:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

### Custom Events Tracking
To track custom events in your application, you can use the Vercel Analytics package:

```javascript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <MainApp />
      <Analytics />
    </>
  );
}
```

For tracking custom events:
```javascript
import { track } from '@vercel/analytics';

// Track custom events
track('qr_generated', { 
  type: 'business', 
  mode: 'ai',
  timestamp: new Date().toISOString()
});
```

## Firebase Analytics

### Configuration
Firebase Analytics is already integrated into the application through the Firebase configuration in [src/lib/firebase.ts](file:///c%3A/Users/MSI/OneDrive/Masa%C3%BCst%C3%BC/hoyn%20denemeleri/hoyn1/src/lib/firebase.ts).

### User Behavior Tracking
Firebase Analytics automatically tracks user engagement, retention, and conversion events. To track specific events:

```javascript
import { analytics } from '../lib/firebase';
import { logEvent } from 'firebase/analytics';

// Track custom events
logEvent(analytics, 'qr_scanned', {
  qr_type: 'profile',
  user_type: 'anonymous',
  timestamp: new Date().toISOString()
});
```

### Conversion Tracking
Set up conversion tracking for key user actions:
- Profile creation
- QR code generation
- QR code scanning
- Message sending
- Business profile completion

## Error Tracking

### Client-side Error Boundaries
Implement React error boundaries to catch UI errors:

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### API Route Logging
Add logging to API routes for better error tracking:

```javascript
// In API routes
export default function handler(req, res) {
  try {
    // Your API logic here
    console.log('API call:', req.method, req.url);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

## Performance Monitoring

### Web Vitals
Monitor these key metrics:
1. **Largest Contentful Paint (LCP)** - Loading performance
2. **First Input Delay (FID)** - Interactivity
3. **Cumulative Layout Shift (CLS)** - Visual stability

### Bundle Size Analysis
Use Vercel's built-in bundle analysis:
1. Go to your deployment URL
2. Add `/_analyze` to the end of the URL
3. View bundle size breakdown

### API Response Time Monitoring
Track API response times in your API routes:
```javascript
export default function handler(req, res) {
  const start = Date.now();
  
  // Your API logic here
  
  const duration = Date.now() - start;
  console.log(`API Response Time: ${duration}ms`);
  
  res.status(200).json({ success: true });
}
```

## Alerting and Notifications

### Vercel Alerts
Set up alerts in the Vercel dashboard:
1. Navigate to your project settings
2. Go to the "Alerts" section
3. Configure alerts for:
   - Deployment failures
   - Performance degradation
   - High error rates

### Custom Alerting
Implement custom alerting for critical application events:
```javascript
// Send alerts for critical errors
function sendAlert(message, severity = 'warning') {
  // Integration with alerting service (e.g., Slack, Email)
  console.log(`ALERT [${severity}]: ${message}`);
}
```

## Monitoring Dashboard

### Recommended Monitoring Setup
1. **Vercel Analytics** - For web vitals and user behavior
2. **Firebase Analytics** - For user engagement and conversion tracking
3. **Custom Logging** - For application-specific metrics
4. **Error Tracking** - For catching and reporting errors

### Key Metrics to Monitor
- Daily/Monthly Active Users
- QR Generation Rate
- QR Scanning Rate
- Message Sending Rate
- Authentication Success Rate
- API Response Times
- Error Rates
- Page Load Times

## Best Practices

### Data Privacy
Ensure compliance with data privacy regulations:
- Anonymize user data where possible
- Provide clear privacy policy
- Implement data retention policies

### Performance Optimization
- Regularly review performance metrics
- Optimize based on user feedback
- Monitor for performance regressions

### Security Monitoring
- Monitor for unusual activity patterns
- Set up alerts for security events
- Regularly review access logs