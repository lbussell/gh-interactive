build:
    go build -o gh-interactive .

install:
    if gh extension list | awk 'NR > 1 {print $1 " " $2}' | grep -qx 'gh interactive'; then gh extension remove interactive; fi
    gh extension install .
