import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskBadge } from "./RiskBadge";
import { FraudActionBadge } from "./FraudActionBadge";
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import type { FraudAlert } from "@/mocks/data/fraud";

export function FraudAlertsTable({ alerts }: { alerts: FraudAlert[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Rule triggered</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell className="font-medium">{alert.userName}</TableCell>
              <TableCell className="max-w-[220px] truncate text-muted-foreground">
                {alert.ruleTriggered}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrencyFromCents(alert.amountCents)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{alert.riskScore}</TableCell>
              <TableCell>
                <RiskBadge level={alert.riskLevel} />
              </TableCell>
              <TableCell>
                <FraudActionBadge action={alert.action} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(alert.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
