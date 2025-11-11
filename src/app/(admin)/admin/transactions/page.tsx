"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

// Dynamic import for modal component
const PaymentVerificationModal = dynamic(
  () => import("@/components/admin/PaymentVerificationModal").then((mod) => ({ default: mod.PaymentVerificationModal })),
  {
    loading: () => null,
    ssr: false,
  }
);

interface Transaction {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  provider: string | null;
  reference: string | null;
  status: string;
  verifiedBy: number | null;
  verifiedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  total: number;
  status: string;
}

interface Customer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

interface TransactionWithDetails extends Transaction {
  order?: Order;
  customer?: Customer;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  COMPLETED: "Complétée",
  FAILED: "Échouée",
};

const METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  CASH: "Espèces",
};

const PROVIDER_LABELS: Record<string, string> = {
  "M-Pesa": "M-Pesa",
  "Airtel Money": "Airtel Money",
  "Orange Money": "Orange Money",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, search, statusFilter, methodFilter, providerFilter, startDate, endDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/transactions?limit=100");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();

      // Fetch order and customer details for each transaction
      const transactionsWithDetails = await Promise.all(
        data.map(async (transaction: Transaction) => {
          try {
            const orderRes = await fetch(`/api/orders?id=${transaction.orderId}`);
            const order = orderRes.ok ? await orderRes.json() : null;

            let customer = null;
            if (order) {
              const customerRes = await fetch(`/api/customers?id=${order.customerId}`);
              customer = customerRes.ok ? await customerRes.json() : null;
            }

            return { ...transaction, order, customer };
          } catch (error) {
            console.error("Error fetching details:", error);
            return transaction;
          }
        })
      );

      setTransactions(transactionsWithDetails);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Erreur lors du chargement des transactions");
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.reference?.toLowerCase().includes(searchLower) ||
          t.order?.orderNumber.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (methodFilter !== "ALL") {
      filtered = filtered.filter((t) => t.method === methodFilter);
    }

    if (providerFilter !== "ALL") {
      filtered = filtered.filter((t) => t.provider === providerFilter);
    }

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      filtered = filtered.filter((t) => t.createdAt >= startTimestamp);
    }

    if (endDate) {
      const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => t.createdAt <= endTimestamp);
    }

    setFilteredTransactions(filtered);
  };

  const getStatusCount = (status: string) => {
    if (status === "ALL") return transactions.length;
    return transactions.filter((t) => t.status === status).length;
  };

  const getPendingOver24Hours = () => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return transactions.filter(
      (t) => t.status === "PENDING" && t.createdAt < twentyFourHoursAgo
    ).length;
  };

  const handleVerify = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setVerificationModalOpen(true);
  };

  const handleVerificationComplete = () => {
    setVerificationModalOpen(false);
    setSelectedTransaction(null);
    fetchTransactions();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des transactions...</p>
        </div>
      </div>
    );
  }

  const pendingOver24h = getPendingOver24Hours();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et vérifiez les paiements
          </p>
        </div>
      </div>

      {/* Alert for pending > 24h */}
      {pendingOver24h > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">
                {pendingOver24h} paiement{pendingOver24h > 1 ? "s" : ""} en
                attente depuis plus de 24 heures
              </p>
              <p className="text-sm text-yellow-700">
                Veuillez vérifier ces transactions rapidement
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ALL">
            Toutes ({getStatusCount("ALL")})
          </TabsTrigger>
          <TabsTrigger value="PENDING">
            En attente ({getStatusCount("PENDING")})
          </TabsTrigger>
          <TabsTrigger value="COMPLETED">
            Complétées ({getStatusCount("COMPLETED")})
          </TabsTrigger>
          <TabsTrigger value="FAILED">
            Échouées ({getStatusCount("FAILED")})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Référence ou N° commande..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Date début"
              />
            </div>

            <div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Date fin"
              />
            </div>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les méthodes</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                <SelectItem value="CASH">Espèces</SelectItem>
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les fournisseurs</SelectItem>
                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                <SelectItem value="Orange Money">Orange Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>N° Commande</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Aucune transaction trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => {
                  const isPendingOver24h =
                    transaction.status === "PENDING" &&
                    transaction.createdAt < Date.now() - 24 * 60 * 60 * 1000;

                  return (
                    <TableRow key={transaction.id} className={isPendingOver24h ? "bg-yellow-50/50" : ""}>
                      <TableCell className="font-medium">
                        {transaction.reference || (
                          <span className="text-muted-foreground italic">
                            Non définie
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.order?.orderNumber || "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {METHOD_LABELS[transaction.method] || transaction.method}
                      </TableCell>
                      <TableCell>
                        {transaction.provider
                          ? PROVIDER_LABELS[transaction.provider] || transaction.provider
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[transaction.status]}
                        >
                          {transaction.status === "PENDING" && (
                            <Clock className="h-3 w-3" />
                          )}
                          {transaction.status === "COMPLETED" && (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {transaction.status === "FAILED" && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {STATUS_LABELS[transaction.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(transaction.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(transaction)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {transaction.status === "PENDING" ? "Vérifier" : "Voir"}
                          </Button>
                          {transaction.order && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={`/admin/commandes/${transaction.order.id}`}>
                                Voir commande
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verification Modal */}
      {selectedTransaction && verificationModalOpen && (
        <PaymentVerificationModal
          open={verificationModalOpen}
          onOpenChange={setVerificationModalOpen}
          transaction={selectedTransaction}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </div>
  );
}