import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, AlertTriangle, ShieldAlert, DollarSign } from "lucide-react";

export default function RiskCalculator() {
  const [balance, setBalance] = useState<string>("10000");
  const [riskPercent, setRiskPercent] = useState<string>("1.0");
  const [stopLoss, setStopLoss] = useState<string>("20");
  const [instrument, setInstrument] = useState<string>("XAUUSD");

  const results = useMemo(() => {
    const bal = parseFloat(balance) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const sl = parseFloat(stopLoss) || 0;

    // Default pip value mapping (simplified for UI)
    // In reality, this depends on lot size, account currency, etc.
    // For standard lots (1.0) on standard accounts:
    // XAUUSD: $10/pip, NAS100: $10/point (if 1 lot = 1 index), BTCUSD: varies.
    // The prompt says: "Pip values: XAUUSD = $1/pip/0.01lot, NAS100 = $1/pip/0.01lot, BTCUSD = $1/pip/0.01lot"
    // Which means $10 per pip for 1.0 standard lot across the board for calculation purposes.
    const pipValuePerStandardLot = 10;

    const monetaryRisk = bal * (risk / 100);
    let lotSize = 0;
    
    if (sl > 0) {
      // monetaryRisk = sl * pipValuePerStandardLot * lotSize
      // lotSize = monetaryRisk / (sl * pipValuePerStandardLot)
      lotSize = monetaryRisk / (sl * pipValuePerStandardLot);
    }

    return {
      monetaryRisk,
      lotSize: isFinite(lotSize) && lotSize > 0 ? lotSize : 0,
      maxLoss: monetaryRisk
    };
  }, [balance, riskPercent, stopLoss, instrument]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Calculator</h1>
          <p className="text-muted-foreground">Compute position sizing and exact monetary risk.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <Card className="md:col-span-5 bg-card">
          <CardHeader>
            <CardTitle>Trade Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Account Balance ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="balance"
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="pl-9 font-mono bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk">Risk Percentage (%)</Label>
              <Input 
                id="risk"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="font-mono bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sl">Stop Loss (Pips/Points)</Label>
              <Input 
                id="sl"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="font-mono bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>Instrument</Label>
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XAUUSD">XAUUSD (Gold)</SelectItem>
                  <SelectItem value="NAS100">NAS100 (Nasdaq)</SelectItem>
                  <SelectItem value="BTCUSD">BTCUSD (Bitcoin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-7 space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Required Position Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-bold font-mono text-primary tracking-tighter">
                {results.lotSize.toFixed(2)} <span className="text-2xl text-muted-foreground font-sans tracking-normal">lots</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Execute this lot size to maintain exact risk parameters.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Monetary Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-destructive">
                  ${results.monetaryRisk.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Value per Pip/Pt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  ${((results.lotSize * 10)).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-dashed">
            <CardContent className="p-4 flex gap-3 text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
              <p>
                Calculations assume standard account configurations ($10/pip for 1.0 standard lot). 
                Always double-check lot sizing on your broker platform before executing trades, especially for indices and crypto.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
