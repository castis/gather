function work() {
    cd /opt/yayhooray/api
    export $(cat /root/yay.env | xargs)
}
