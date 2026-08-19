with open('src/pages/Rewards.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "<button disabled={rewardPoints < 100}",
    "<button onClick={() => navigate('/services?redeem=true')} disabled={rewardPoints < 100}"
)
with open('src/pages/Rewards.tsx', 'w') as f:
    f.write(content)
