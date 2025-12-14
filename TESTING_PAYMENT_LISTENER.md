# Test Payment Listener

## Quick Test Commands

### 1. Check Listener Status
```bash
curl http://localhost:3001/subscriptions/payment/listener/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "isListening": true,
  "receiverAddress": "0xYourReceiverAddress",
  "contractAddress": "0xUSDTContractAddress",
  "provider": "Connected"
}
```

### 2. Manual Trigger Crawl (Optional)
```bash
curl -X POST http://localhost:3001/subscriptions/payment/listener/crawl \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Watch Backend Logs

The listener will automatically log when:
- App starts: `🚀 Starting Payment Listener Service...`
- Event detected: `💰 New USDT transfer detected!`
- Payment verified: `✅ Payment {id} verified and subscription activated!`

**Example Log Output:**
```
🚀 Starting Payment Listener Service...
👂 Listening to USDT Transfer events for receiver: 0x...
✅ Event listener started successfully
⏰ Starting periodic crawler (every 2 minutes)...

💰 New USDT transfer detected!
   From: 0xUserAddress
   To: 0xReceiverAddress
   Amount: 29 USDT
   Tx: 0x...
📝 Updated payment uuid with transaction hash
🔍 Verifying payment uuid...
✅ Payment uuid verified and subscription activated!
```

## Test Flow

### Step 1: Start Backend
```bash
cd backend
pnpm run start:dev
```

Watch for:
```
🚀 Starting Payment Listener Service...
✅ Event listener started successfully
```

### Step 2: Create Payment Request
```bash
curl -X POST http://localhost:3001/subscriptions/{subscriptionId}/payment/request \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 29}'
```

### Step 3: Sign Message (Frontend)
Open browser console and sign the message.

### Step 4: Submit Signature
```bash
curl -X POST http://localhost:3001/subscriptions/payment/{paymentId}/signature \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "0x...",
    "walletAddress": "0x..."
  }'
```

### Step 5: Send USDT
Send USDT from your wallet to the receiver address.

### Step 6: Watch Automatic Verification
The backend will automatically:
1. Detect the Transfer event (< 1 second)
2. Verify the transaction on-chain
3. Activate the subscription

**No manual verification needed!**

## Monitoring

### Check Application Logs
```bash
# Backend logs
cd backend
tail -f logs/app.log

# Or just watch the console where you run start:dev
```

### Check Payment Status
```bash
curl http://localhost:3001/subscriptions/{subscriptionId}/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Look for:
```json
{
  "id": "...",
  "status": "succeeded",  // Changed from "pending"
  "transactionHash": "0x...",
  ...
}
```

## Troubleshooting

### Listener Not Working?

1. **Check Status**:
   ```bash
   curl http://localhost:3001/subscriptions/payment/listener/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Check USDT Contract Address**:
   - Verify `USDT_CONTRACT_AMOY` in `.env`
   - Should match actual USDT contract on Amoy

3. **Check RPC Connection**:
   - Verify `AMOY_RPC_URL` is correct
   - Test: `curl https://rpc-amoy.polygon.technology -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

4. **Check Receiver Address**:
   - Verify `WEB3_RECEIVER_ADDRESS` matches payment destination

### Event Not Detected?

1. **Transaction confirmed?**
   - Check on https://amoy.polygonscan.com
   - Must be confirmed (not pending)

2. **Correct contract?**
   - Transfer must be from USDT contract
   - Not native MATIC transfer

3. **Correct receiver?**
   - Transfer must be TO `WEB3_RECEIVER_ADDRESS`

4. **Wait for periodic crawler**:
   - Runs every 2 minutes as backup
   - Or manually trigger: `POST /subscriptions/payment/listener/crawl`

## Success Indicators

✅ **Listener is working** when you see:
- `isListening: true` in status endpoint
- Startup logs show "Event listener started successfully"

✅ **Payment is verified** when:
- Payment status changes to "succeeded"
- Subscription status becomes "active"
- User sees success message in frontend

✅ **System is healthy** when:
- No error logs in backend
- Periodic crawler runs without errors
- Status endpoint returns valid data

## Performance Notes

- **Event Detection**: < 1 second after block confirmation
- **Verification Time**: 2-5 seconds (blockchain query)
- **Periodic Crawler**: Every 2 minutes (backup)
- **Payment Expiry**: 30 minutes (configurable)

## Demo Test (Using Testnet)

1. Get Amoy MATIC: https://faucet.polygon.technology/
2. Get testnet USDT (or deploy test contract)
3. Create payment request
4. Sign message
5. Send USDT
6. Watch backend logs - should see automatic verification within seconds!

---

**The system is fully automatic!** No cron jobs, no manual scripts, no manual verification. Just start the app and it works! 🎉
