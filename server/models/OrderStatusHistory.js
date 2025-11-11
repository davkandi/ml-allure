/**
 * OrderStatusHistory Model
 * 
 * Tracks all status changes for orders with full audit trail.
 * This is an optional enhancement model for reference.
 * 
 * The actual implementation uses Prisma schema (see prisma/schema.prisma)
 * 
 * @typedef {Object} OrderStatusHistory
 * @property {string} id - UUID primary key
 * @property {string} orderId - Reference to Order
 * @property {string|null} fromStatus - Previous order status (null for initial creation)
 * @property {string} toStatus - New order status
 * @property {string|null} changedBy - User ID who made the change (null for system)
 * @property {string|null} notes - Additional notes about the change
 * @property {Date} createdAt - Timestamp of the change
 * 
 * @example
 * // Status history entry
 * {
 *   id: "uuid-v4",
 *   orderId: "order-uuid",
 *   fromStatus: "PENDING",
 *   toStatus: "CONFIRMED",
 *   changedBy: "user-uuid",
 *   notes: "Order confirmed by admin",
 *   createdAt: "2025-01-23T10:30:00Z"
 * }
 */

/**
 * OrderStatus Enum
 * @enum {string}
 */
const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

/**
 * Status workflow mapping
 * Defines valid status transitions
 */
const StatusWorkflow = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_PICKUP', 'SHIPPED', 'CANCELLED'],
  READY_FOR_PICKUP: ['DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

/**
 * Validate status transition
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} - Whether transition is valid
 */
function isValidStatusTransition(fromStatus, toStatus) {
  if (!fromStatus) return toStatus === OrderStatus.PENDING;
  return StatusWorkflow[fromStatus]?.includes(toStatus) || false;
}

/**
 * Get status display info
 * @param {string} status - Order status
 * @returns {Object} - Display information
 */
function getStatusDisplayInfo(status) {
  const statusInfo = {
    PENDING: {
      label: 'En attente',
      color: 'yellow',
      icon: 'clock',
      description: 'Commande en attente de confirmation',
    },
    CONFIRMED: {
      label: 'Confirmée',
      color: 'blue',
      icon: 'check-circle',
      description: 'Commande confirmée',
    },
    PROCESSING: {
      label: 'En préparation',
      color: 'purple',
      icon: 'package',
      description: 'Commande en cours de préparation',
    },
    READY_FOR_PICKUP: {
      label: 'Prête pour retrait',
      color: 'indigo',
      icon: 'shopping-bag',
      description: 'Commande prête à être retirée en magasin',
    },
    SHIPPED: {
      label: 'Expédiée',
      color: 'cyan',
      icon: 'truck',
      description: 'Commande en cours de livraison',
    },
    DELIVERED: {
      label: 'Livrée',
      color: 'green',
      icon: 'check',
      description: 'Commande livrée avec succès',
    },
    CANCELLED: {
      label: 'Annulée',
      color: 'red',
      icon: 'x',
      description: 'Commande annulée',
    },
  };

  return statusInfo[status] || { label: status, color: 'gray', icon: 'help', description: '' };
}

/**
 * Format status history for timeline display
 * @param {Array} history - Array of status history entries
 * @returns {Array} - Formatted timeline data
 */
function formatStatusHistoryForTimeline(history) {
  return history.map(entry => {
    const statusInfo = getStatusDisplayInfo(entry.toStatus);
    
    return {
      id: entry.id,
      status: entry.toStatus,
      label: statusInfo.label,
      color: statusInfo.color,
      icon: statusInfo.icon,
      description: entry.notes || statusInfo.description,
      timestamp: entry.createdAt,
      changedBy: entry.changedBy ? {
        id: entry.changedBy,
        name: entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : 'Unknown',
      } : {
        id: null,
        name: 'Système',
      },
    };
  });
}

module.exports = {
  OrderStatus,
  StatusWorkflow,
  isValidStatusTransition,
  getStatusDisplayInfo,
  formatStatusHistoryForTimeline,
};
