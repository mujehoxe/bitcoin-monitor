import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export const TestCoinSelector: React.FC = () => {
  return (
    <div className="w-80 space-y-4 bg-green-100 p-4 border-2 border-green-500">
      <div className="text-sm font-bold text-green-800">
        TEST COIN SELECTOR - This should always be visible
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Test Currency Selector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs">
              USD
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs">
              EUR
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs">
              GBP
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">🔥 Test Hot Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-2 border rounded bg-white">
              <div className="font-semibold text-sm">Bitcoin (BTC)</div>
              <div className="text-xs text-gray-600">$45,123.45 (+2.34%)</div>
            </div>
            <div className="p-2 border rounded bg-white">
              <div className="font-semibold text-sm">Ethereum (ETH)</div>
              <div className="text-xs text-gray-600">$2,845.67 (+1.78%)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📈 Test Stable Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-2 border rounded bg-white">
              <div className="font-semibold text-sm">Cardano (ADA)</div>
              <div className="text-xs text-gray-600">$0.45 (+0.95%)</div>
            </div>
            <div className="p-2 border rounded bg-white">
              <div className="font-semibold text-sm">Polkadot (DOT)</div>
              <div className="text-xs text-gray-600">$7.23 (+1.12%)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
