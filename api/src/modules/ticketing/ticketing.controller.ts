import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  ticketEventSchema,
  ticketEventParamsSchema,
  ticketEventIdSchema,
  ticketEventQuerySchema,
  ticketOrderCreateSchema,
  ticketOrderIdSchema,
  ticketOrderStatusSchema
} from './ticketing.schema.js';
import {
  createTicketEvent,
  createTicketOrder,
  deleteTicketEvent,
  ensureRetailerAccess,
  getEventById,
  getTicketOrderForConsumer,
  getTicketOrderForRetailer,
  listAllTicketEvents,
  listAllTicketOrders,
  getTicketOrderById,
  listPublicEvents,
  listRetailerEvents,
  listTicketOrdersForConsumer,
  listTicketOrdersForRetailer,
  updateTicketEvent,
  updateTicketOrderStatus
} from './ticketing.service.js';

export const listPublicEventsHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query = ticketEventQuerySchema.safeParse(req.query);
  const events = await listPublicEvents(query.success ? query.data : {});
  res.json({ data: events });
});

export const getEventHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketEventIdSchema.parse(req.params);
  const event = await getEventById(params.eventId);
  res.json({ data: event });
});

export const listRetailerEventsHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketEventParamsSchema.parse(req.params);
  ensureRetailerAccess(params.retailerId, req.user?.retailerId, req.user?.role === 'SUPER_ADMIN');
  const events = await listRetailerEvents(params.retailerId);
  res.json({ data: events });
});

export const createTicketEventHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketEventParamsSchema.parse(req.params);
  ensureRetailerAccess(params.retailerId, req.user?.retailerId, req.user?.role === 'SUPER_ADMIN');
  const payload = ticketEventSchema.parse(req.body);
  const event = await createTicketEvent(params.retailerId, payload);
  res.status(201).json({ data: event });
});

export const updateTicketEventHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketEventParamsSchema.parse(req.params);
  const eventId = ticketEventIdSchema.parse(req.params);
  ensureRetailerAccess(params.retailerId, req.user?.retailerId, req.user?.role === 'SUPER_ADMIN');
  const payload = ticketEventSchema.parse(req.body);
  const event = await updateTicketEvent(params.retailerId, eventId.eventId, payload);
  res.json({ data: event });
});

export const deleteTicketEventHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketEventParamsSchema.parse(req.params);
  const eventId = ticketEventIdSchema.parse(req.params);
  ensureRetailerAccess(params.retailerId, req.user?.retailerId, req.user?.role === 'SUPER_ADMIN');
  await deleteTicketEvent(params.retailerId, eventId.eventId);
  res.status(204).send();
});

export const createTicketOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = ticketOrderCreateSchema.parse(req.body);
  const order = await createTicketOrder(req.user?.id, payload);
  res.status(201).json({ data: order });
});

export const listConsumerOrdersHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orders = await listTicketOrdersForConsumer(req.user!.id);
  res.json({ data: orders });
});

export const getConsumerOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketOrderIdSchema.parse(req.params);
  const order = await getTicketOrderForConsumer(req.user!.id, params.orderId);
  res.json({ data: order });
});

export const listRetailerOrdersHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketEventParamsSchema.parse(req.params);
  ensureRetailerAccess(params.retailerId, req.user?.retailerId, req.user?.role === 'SUPER_ADMIN');
  const orders = await listTicketOrdersForRetailer(params.retailerId);
  res.json({ data: orders });
});

export const getRetailerOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketEventParamsSchema.parse(req.params);
  const orderParams = ticketOrderIdSchema.parse(req.params);
  ensureRetailerAccess(params.retailerId, req.user?.retailerId, req.user?.role === 'SUPER_ADMIN');
  const order = await getTicketOrderForRetailer(params.retailerId, orderParams.orderId);
  res.json({ data: order });
});

export const updateRetailerOrderStatusHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketEventParamsSchema.parse(req.params);
  const orderParams = ticketOrderIdSchema.parse(req.params);
  ensureRetailerAccess(params.retailerId, req.user?.retailerId, req.user?.role === 'SUPER_ADMIN');
  const payload = ticketOrderStatusSchema.parse(req.body);
  const order = await updateTicketOrderStatus(params.retailerId, orderParams.orderId, payload.status);
  res.json({ data: order });
});

export const listAdminEventsHandler = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const events = await listAllTicketEvents();
  res.json({ data: events });
});

export const listAdminOrdersHandler = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const orders = await listAllTicketOrders();
  res.json({ data: orders });
});

export const getAdminOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = ticketOrderIdSchema.parse(req.params);
  const order = await getTicketOrderById(params.orderId);
  res.json({ data: order });
});
