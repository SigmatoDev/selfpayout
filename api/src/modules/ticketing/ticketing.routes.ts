import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  createTicketEventHandler,
  createTicketOrderHandler,
  deleteTicketEventHandler,
  getConsumerOrderHandler,
  getEventHandler,
  getRetailerOrderHandler,
  listConsumerOrdersHandler,
  listPublicEventsHandler,
  listRetailerEventsHandler,
  listRetailerOrdersHandler,
  updateRetailerOrderStatusHandler,
  updateTicketEventHandler
} from './ticketing.controller.js';

export const ticketingRouter: ExpressRouter = Router();

// Public events
ticketingRouter.get('/events', listPublicEventsHandler);
ticketingRouter.get('/events/:eventId', getEventHandler);

// Consumer ticket orders
ticketingRouter.post('/orders', authenticate(['CONSUMER']), createTicketOrderHandler);
ticketingRouter.get('/orders', authenticate(['CONSUMER']), listConsumerOrdersHandler);
ticketingRouter.get('/orders/:orderId', authenticate(['CONSUMER']), getConsumerOrderHandler);

// Retailer ticket management
ticketingRouter.get(
  '/retailers/:retailerId/events',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  listRetailerEventsHandler
);
ticketingRouter.post(
  '/retailers/:retailerId/events',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  createTicketEventHandler
);
ticketingRouter.patch(
  '/retailers/:retailerId/events/:eventId',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  updateTicketEventHandler
);
ticketingRouter.delete(
  '/retailers/:retailerId/events/:eventId',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  deleteTicketEventHandler
);

ticketingRouter.get(
  '/retailers/:retailerId/orders',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  listRetailerOrdersHandler
);
ticketingRouter.get(
  '/retailers/:retailerId/orders/:orderId',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  getRetailerOrderHandler
);
ticketingRouter.patch(
  '/retailers/:retailerId/orders/:orderId/status',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  updateRetailerOrderStatusHandler
);
