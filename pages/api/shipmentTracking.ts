import type { NextApiRequest, NextApiResponse } from 'next';
import { ShipmentTracking, ShipmentStatus } from '../../lib/services/shipmentTracking';

const shipmentTracker = new ShipmentTracking();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Return current shipment status
      const status = shipmentTracker.getStatus();
      res.status(200).json({ status });
    } else if (req.method === 'POST') {
      // Update shipment status
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: 'Missing status in request body' });
        return;
      }
      shipmentTracker.updateStatus(status as ShipmentStatus);
      res.status(200).json({ message: `Shipment status updated to ${status}` });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
