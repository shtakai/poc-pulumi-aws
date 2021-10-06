import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const env = pulumi.getStack()
const networkCongig = new pulumi.Config('network')
const keyConfig = new pulumi.Config('key')

const ec2Key = keyConfig.require('ec2_key')

const vpcCidr = networkCongig.require('vpc')
const puclicCidr0 = networkCongig.require('public_0')
const puclicCidr1 = networkCongig.require('public_1')
const puclicCidr2 = networkCongig.require('public_2')
const privateCidr0 = networkCongig.require('private_0')
const privateCidr1 = networkCongig.require('private_1')
const privateCidr2 = networkCongig.require('private_2')
const availableZones = aws.getAvailabilityZones({
  state: "available",
});
const az0 = availableZones.then(a => a.names[0])
const az1 = availableZones.then(a => a.names[1])
const az2 = availableZones.then(a => a.names[2])

console.log({ vpcCidr })
const vpcName = `app-${env}-vpc`
const nameForPublicSubnet0 = `app-${env}-public0`
const nameForPublicSubnet1 = `app-${env}-public1`
const nameForPublicSubnet2 = `app-${env}-public2`
const nameForPrivateSubnet0 = `app-${env}-private0`
const nameForPrivateSubnet1 = `app-${env}-private1`
const nameForPrivateSubnet2 = `app-${env}-private2`

const internetGatewayName = `app-${env}-igw`

const vpc = new aws.ec2.Vpc(
  vpcName,
  {
    cidrBlock: vpcCidr,
    tags: {
      Name: vpcName
    }
  }
)


const publicSubnet0 = new aws.ec2.Subnet(
  nameForPublicSubnet0,
  {
    vpcId: vpc.id,
    cidrBlock: puclicCidr0,
    availabilityZone: az0,
    mapPublicIpOnLaunch: true,
    tags: {
      Name: nameForPublicSubnet0
    }
  }
)

const publicSubnet1 = new aws.ec2.Subnet(
  nameForPublicSubnet1,
  {
    vpcId: vpc.id,
    cidrBlock: puclicCidr1,
    availabilityZone: az1,
    mapPublicIpOnLaunch: true,
    tags: {
      Name: nameForPublicSubnet1
    }
  }
)

const publicSubnet2 = new aws.ec2.Subnet(
  nameForPublicSubnet2,
  {
    vpcId: vpc.id,
    cidrBlock: puclicCidr2,
    availabilityZone: az2,
    mapPublicIpOnLaunch: true,
    tags: {
      Name: nameForPublicSubnet2
    }
  }
)

const privateSubnet0 = new aws.ec2.Subnet(
  nameForPrivateSubnet0,
  {
    vpcId: vpc.id,
    cidrBlock: privateCidr0,
    tags: {
      Name: nameForPrivateSubnet0
    }
  }
)

const privateSubnet1 = new aws.ec2.Subnet(
  nameForPrivateSubnet1,
  {
    vpcId: vpc.id,
    cidrBlock: privateCidr1,
    tags: {
      Name: nameForPrivateSubnet1
    }
  }
)
const privateSubnet2 = new aws.ec2.Subnet(
  nameForPrivateSubnet2,
  {
    vpcId: vpc.id,
    cidrBlock: privateCidr2,
    tags: {
      Name: nameForPrivateSubnet2
    }
  }
)

const internetGateway = new aws.ec2.InternetGateway(
  internetGatewayName,
  {
    vpcId: vpc.id,
    tags: {
      Name: internetGatewayName
    }
  }
)

const publicRouteTableName = `app-${env}-public-route-table`
const publicRouteTable = new aws.ec2.RouteTable(
  publicRouteTableName,
  {
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id
      }
    ],
    vpcId: vpc.id,
    tags: {
      Name: publicRouteTableName
    }
  }
)

const publicRouteTableAssociation0 = new aws.ec2.RouteTableAssociation(
  'public association 0',
  {
    routeTableId: publicRouteTable.id,
    subnetId: publicSubnet0.id,
  }
)
const publicRouteTableAssociation1 = new aws.ec2.RouteTableAssociation(
  'public association 1',
  {
    routeTableId: publicRouteTable.id,
    subnetId: publicSubnet1.id,
  }
)
const publicRouteTableAssociation2 = new aws.ec2.RouteTableAssociation(
  'public association 2',
  {
    routeTableId: publicRouteTable.id,
    subnetId: publicSubnet2.id,
  }
)

const privateRouteTableName = `app-${env}-private-route-table`
const privateRouteTable = new aws.ec2.RouteTable(
  privateRouteTableName,
  {
    vpcId: vpc.id,
    tags: {
      Name: privateRouteTableName
    }
  }
)

const privateRouteTableAssociation0 = new aws.ec2.RouteTableAssociation(
  'private association 0',
  {
    routeTableId: privateRouteTable.id,
    subnetId: privateSubnet0.id
  }
)
const privateRouteTableAssociation1 = new aws.ec2.RouteTableAssociation(
  'private association 1',
  {
    routeTableId: privateRouteTable.id,
    subnetId: privateSubnet1.id
  }
)
const privateRouteTableAssociation2 = new aws.ec2.RouteTableAssociation(
  'private association 2',
  {
    routeTableId: privateRouteTable.id,
    subnetId: privateSubnet2.id
  }
)
const group = new aws.ec2.SecurityGroup("web-sg", {
    description: `${env} : Enable HTTP access`,
    vpcId: vpc.id,
    ingress: [
      { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
      { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
      { protocol: "icmp", fromPort: -1, toPort: -1, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      }
    ],
    tags: {
      Name: `sg ${env} web`
    }
  }
);

const userData =
`#!/bin/bash
echo "Hello, World! tetete ${env}}" > index.html
nohup python -m SimpleHTTPServer 80 &`;


const publicServer = new aws.ec2.Instance(`puclic-${env}-web-server`, {
    ami: "ami-02892a4ea9bfa2192",
    instanceType: "t2.micro",
    vpcSecurityGroupIds: [ group.id ],
    userData: userData,
    subnetId: publicSubnet0.id,
    associatePublicIpAddress: true,
    keyName: ec2Key,
    tags: {
      Name: `puclic ec2 ${env} web`
    }
});

const privateServer = new aws.ec2.Instance(`private-${env}-web-server`, {
  ami: "ami-02892a4ea9bfa2192",
  instanceType: "t2.micro",
  vpcSecurityGroupIds: [ group.id ],
  userData: userData,
  subnetId: privateSubnet1.id,
  keyName: ec2Key,
  tags: {
    Name: `private ec2 ${env} web`
  }
});

export const publicIp = publicServer.publicIp;
export const publicPrivateIp = publicServer.publicIp;
export const publicDns = publicServer.publicDns;
export const publicPrivateDns = publicServer.privateDns;

export const privateIp = privateServer.privateIp;
export const privateDns = privateServer.privateDns;
