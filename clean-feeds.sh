#!/bin/bash

# Create a cleaned version of the CSV by removing feeds that are known to be broken
echo "🧹 Cleaning up crypto_feeds.csv..."

# Backup the original
cp crypto_feeds.csv crypto_feeds_backup.csv

# Create a list of known broken feeds to remove
cat > broken_feeds.txt << 'EOF'
bit-sites
hegion
zycrypto
coinworldstory
ukbitcoinblog
cryptomurmur
blockchaincongressusa
oilblockchain.news
coincurrencynews
goldsilveranalyst
blog.btc
blocknewsafrica
cryptocurrencynewscast.online
coinatmradar
belfrics
cryptomining-blog
blog.bitpanda
cryptoinsider.media
crypto-news
insidebitcoins
blog.spectrocoin
blog.flitpay.in
blog.feedspot
paperblockchain
cryptstorm
blog.purse.io
about.crunchbase
coin.space
tronweekly
bitcoinprbuzz
crypnotic
bestbitcoinexchange.io
bitstarz
cryptoninjas
smartereum
btcworldnews
coinfrog.io
ethereumworldnews
bitcoinspakistan
EOF

echo "📊 Original feed count: $(wc -l < crypto_feeds.csv)"

# Create a temporary file with working feeds
{
  echo "Feeds"
  grep -v -f broken_feeds.txt crypto_feeds.csv | grep -v "^Feeds$" | sort | uniq
} > crypto_feeds_cleaned.csv

echo "📊 Cleaned feed count: $(wc -l < crypto_feeds_cleaned.csv)"

# Replace the original file
mv crypto_feeds_cleaned.csv crypto_feeds.csv

# Cleanup
rm broken_feeds.txt

echo "✅ CSV cleaned successfully"
echo "📁 Backup saved as: crypto_feeds_backup.csv"
