'use client';

import { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Calculator,
  Info
} from 'lucide-react';

interface CommissionOffer {
  id: string;
  agent_type?: string;
  rate: number;
  min_amount: number;
  max_amount?: number;
  status: 'active' | 'inactive';
}

interface CommissionMatchPanelProps {
  merchantId: string;
  merchantName: string;
  currentRate: number;
  agentExpectation?: {
    expected_rate: number;
    min_acceptable_rate: number;
  };
  merchantOffers?: CommissionOffer[];
}

export default function CommissionMatchPanel({
  merchantId,
  merchantName,
  currentRate,
  agentExpectation,
  merchantOffers = []
}: CommissionMatchPanelProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Find the best matching offer
  const findBestOffer = () => {
    const activeOffers = merchantOffers.filter(o => o.status === 'active');
    if (activeOffers.length === 0) return null;
    
    // Sort by rate descending
    return activeOffers.sort((a, b) => b.rate - a.rate)[0];
  };
  
  const bestOffer = findBestOffer();
  const isRateAcceptable = agentExpectation 
    ? currentRate >= agentExpectation.min_acceptable_rate 
    : true;
  
  const getMatchStatus = () => {
    if (!agentExpectation) return 'no_expectation';
    if (currentRate >= agentExpectation.expected_rate) return 'matched';
    if (currentRate >= agentExpectation.min_acceptable_rate) return 'acceptable';
    return 'below_minimum';
  };
  
  const matchStatus = getMatchStatus();
  
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Commission Matching</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {/* Current Status */}
      <div className={`p-4 rounded-lg border-2 ${
        matchStatus === 'matched' ? 'bg-green-50 border-green-200' :
        matchStatus === 'acceptable' ? 'bg-yellow-50 border-yellow-200' :
        matchStatus === 'below_minimum' ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Current Commission Rate</span>
          {matchStatus === 'matched' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : matchStatus === 'below_minimum' ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : (
            <Info className="w-5 h-5 text-gray-600" />
          )}
        </div>
        <p className="text-2xl font-bold mb-2">{(currentRate * 100).toFixed(1)}%</p>
        <p className="text-sm text-gray-600">
          {matchStatus === 'matched' && "Rate meets your expectations"}
          {matchStatus === 'acceptable' && "Rate is acceptable but below expectation"}
          {matchStatus === 'below_minimum' && "Rate is below your minimum requirement"}
          {matchStatus === 'no_expectation' && "No expectation set"}
        </p>
      </div>
      
      {/* Agent Expectation */}
      {agentExpectation && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Your Expectations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-700 mb-1">Expected Rate</p>
              <p className="text-lg font-semibold text-purple-900">
                {(agentExpectation.expected_rate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-700 mb-1">Minimum Acceptable</p>
              <p className="text-lg font-semibold text-orange-900">
                {(agentExpectation.min_acceptable_rate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Merchant Offers */}
      {showDetails && merchantOffers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Available Merchant Offers</h3>
          <div className="space-y-2">
            {merchantOffers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => setSelectedOfferId(offer.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedOfferId === offer.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${offer.status === 'inactive' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {(offer.rate * 100).toFixed(1)}% Commission
                      </p>
                      <p className="text-xs text-gray-500">
                        {offer.agent_type || 'All agents'} • 
                        Min: ${offer.min_amount}
                        {offer.max_amount && ` • Max: $${offer.max_amount}`}
                      </p>
                    </div>
                  </div>
                  {offer.id === bestOffer?.id && (
                    <span className="text-xs font-medium text-green-600">Best Rate</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Matching Simulation */}
      {showDetails && (
        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2 mb-3">
            <Calculator className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Commission Simulation</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Order Amount: $1,000</span>
              <span className="font-medium">${(1000 * currentRate).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Order Amount: $5,000</span>
              <span className="font-medium">${(5000 * currentRate).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Order Amount: $10,000</span>
              <span className="font-medium">${(10000 * currentRate).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      {!isRateAcceptable && (
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-3">
            The current rate is below your minimum. Consider discussing with the merchant.
          </p>
          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Request Rate Adjustment
          </button>
        </div>
      )}
    </div>
  );
}

