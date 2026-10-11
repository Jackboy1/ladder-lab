// Worked solutions for the classic terminal labs. Each `solve` is the command sequence that completes every
// objective; tools/validate.js replays it on a fresh box, and the lab page offers it as "Show solution" /
// "Type it for me" so a learner who is stuck can watch the right steps, then reset and retry.
(function(){
const S = {
  "ios-setup": ["enable","configure terminal","hostname SW1","enable secret Cl4ss!c","end","copy running-config startup-config"],
  "ios-ip":    ["enable","configure terminal","interface g0/0","ip address 192.168.10.2 255.255.255.0","no shutdown","do show ip interface brief","end","ping 192.168.10.1"],
  "ios-vlan":  ["enable","configure terminal","vlan 10","name FINANCE","exit","interface g0/1","switchport access vlan 10","no shutdown","end","show vlan brief","copy running-config startup-config"],
  "ios-trunk": ["enable","configure terminal","interface g0/2","switchport mode trunk","switchport trunk allowed vlan 10,20","no shutdown","end","show interfaces trunk","show vlan brief","copy running-config startup-config"],
  "ios-static":["enable","ping 203.0.113.10","configure terminal","ip route 0.0.0.0 0.0.0.0 10.0.12.2","ip route 172.16.5.0 255.255.255.0 10.0.12.2","end","show ip route","ping 203.0.113.10","ping 172.16.5.9","copy running-config startup-config"],
  "ios-ospf":  ["enable","configure terminal","interface g0/0","ip address 10.0.12.1 255.255.255.252","no shutdown","end","ping 10.0.12.2","configure terminal","router ospf 1","router-id 1.1.1.1","network 10.0.12.0 0.0.0.3 area 0","end","show ip ospf neighbor","show ip route","ping 192.168.2.1","copy running-config startup-config"],
  "lx-nav":    ["pwd","ls /var/log","mkdir -p projects/net/configs","touch projects/net/configs/r1.cfg","tail /var/log/app.log"],
  "lx-perms":  ["echo \"echo hi\" > deploy.sh","chmod +x deploy.sh","touch secrets.txt","chmod 600 secrets.txt","ls -l"],
  "lx-logs":   ["grep ERROR /var/log/app.log","grep -c ERROR /var/log/app.log","tail /var/log/app.log","grep ERROR /var/log/app.log > ~/errors.txt","cat ~/errors.txt"],
  "lx-pipes":  ["grep Failed /var/log/auth.log | wc -l","grep Failed /var/log/auth.log | awk '{print $11}'","grep Failed /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn","grep Failed /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn > ~/attackers.txt","cat ~/attackers.txt"],
  "lx-service":["systemctl status nginx","journalctl -u nginx","ss -tlnp","kill 1337","systemctl restart nginx","systemctl status nginx","systemctl enable nginx","ss -tlnp"],
  "git-basics":["git init","echo \"net auditor\" > README.md","git add README.md","git commit -m \"Add README\"","git switch -c feature","echo \"print('audit')\" > auditor.py","git add auditor.py","git commit -m \"Add auditor\"","git switch main","git merge feature","git log"],
  "k8s-deploy":["kubectl create deployment web --image=nginx:1.27 --replicas=2","kubectl get pods","kubectl expose deployment web --port=80","kubectl get svc","kubectl scale deployment web --replicas=4","kubectl get pods","@delete-web-pod","kubectl get pods"],
  "k8s-triage":["kubectl get pods","kubectl describe pod api-7d9f4b-qc7zn","kubectl logs api-7d9f4b-qc7zn --previous","kubectl delete pod api-7d9f4b-x2kqp","kubectl get pods","kubectl scale deployment api --replicas=5","kubectl get deployments"],
};
for (const [id, steps] of Object.entries(S)) if (LL.labs[id]) LL.labs[id].solve = steps;
})();
